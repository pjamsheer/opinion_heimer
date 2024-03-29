# Copyright (c) 2023, jam and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe import _

class Poll(Document):
	@frappe.whitelist()
	def send_poll_realtime_notification(self):
		message = self.message_for_realtime_publish()
		if self.users:
			for user in self.users:
				frappe.publish_realtime(event='heimer_realtime_poll_event', message=message, user=user.user)
		else:
			frappe.publish_realtime(event='heimer_realtime_poll_event', message=message)

	@frappe.whitelist()
	def send_poll_system_notification(self):
		users = self.users

		email_content = self.subject + '<br/>'
		if self.options:
			email_content += 'List of opinions as follows: <br/>'
			for option in self.options:
				email_content += '- {0}<br/>'.format(option.option)

		if not users:
			users = frappe.get_all("User", fields=['name as user'])

		for user in users:
			subject = "The poll on {0} is waiting for your opinion".format(self.title)
			if not frappe.db.exists(
					'Notification Log',
					{
						'for_user': user.user,
						'document_type': self.doctype,
						'document_name': self.name,
						'subject': subject
					}
				):
				doc = frappe.new_doc('Notification Log')
				doc.subject = subject
				doc.email_content = email_content
				doc.for_user = user.user
				doc.document_type = self.doctype
				doc.document_name = self.name
				doc.from_user = self.owner
				doc.insert(ignore_permissions=True)

	@frappe.whitelist()
	def message_for_realtime_publish(self):
		content = '''
			<div>
				<span><b>Subject</b></span>
				<br/>
				<div style="text-align: justify;">
					<span>{0}</span>
				</div>
				<br/><br/>
		'''.format(self.subject)

		if self.options and len(self.options) > 0:
			content += '''
				<span>
					<b>Select your opinion from the list</b>
				</span>
				<br/><br/>
			'''
			for option in self.options:
				content += '''
					<div class="row">
						<div class="col-sm-10">
							<span>{0}</span>
						</div>
						<div class="col-sm-2">
							<button class="btn btn-secondary" selected-opinion="{0}" poll="{1}">Vote</button>
						</div>
					</div>
					<br/>
				'''.format(option.option, self.name)

		content += '</div>'
		return {
			'title': self.title,
			'content': content,
			'broadcast': True
		}

	@frappe.whitelist()
	def show_mark_opinion_dialog_on_form(self):
		if not (is_opinion_marked_for_the_user(self.name, frappe.session.user, self.is_anonymous_poll)):
			return self.message_for_realtime_publish()
		return False

@frappe.whitelist()
def mark_opinion(poll, opinion, user=None, source=None):
	poll_details = frappe.get_value("Poll", poll, ["is_private_poll", "is_anonymous_poll"], as_dict=True)
	if poll_details.is_private_poll:
		if not user:
			user = frappe.session.user
		if(is_opinion_marked_for_the_user(poll, user, poll_details.is_anonymous_poll)):
			frappe.throw(_("The user already marked the opinion!"))

	opinion_doc = {
		"doctype":"Opinion",
		"poll": poll,
		"opinion": opinion
	}

	if source:
		opinion_doc['source'] = source

	if poll_details.is_anonymous_poll:
		opinion_doc['owner'] = "Administrator"

	return frappe.get_doc(opinion_doc).insert(ignore_permissions=True)

@frappe.whitelist()
def is_opinion_marked_for_the_user(poll, user, is_anonymous_poll=False):
	return True if get_user_opinion(poll, user, is_anonymous_poll) else False

def get_user_opinion(poll, user, is_anonymous_poll=False):
	opinion = False
	if is_anonymous_poll:
		query = '''
			select
				opinion_name
			from
				`__Opinion User`
			where
				 poll_name = "{0}" and opinion_user = "{1}"
		'''
		opinion = frappe.db.sql(query.format(poll, user))
	else:
		opinion = frappe.db.exists('Opinion', {"poll": poll, "owner": user})

	return opinion
