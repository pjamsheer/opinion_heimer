# Copyright (c) 2023, jam and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document

class Opinion(Document):
	def after_insert(self):
		if self.is_anonymous_poll and self.is_private_poll:
			set_opinion_user(self.poll, self.name, frappe.session.user)

	def on_trash(self):
		delete_opinion_user(self.name)

def delete_opinion_user(opinion):
	frappe.db.sql(f"""Delete From `__Opinion User` Where opinion_name = '{opinion}' """)

def set_opinion_user(poll, opinion, user):
	query = f"""
		Insert Into
			`__Opinion User`
			(
				`poll_name`, `opinion_name`, `opinion_user`
			)
		Values
			(
				'{poll}', '{opinion}', '{user}'
			)
	"""
	frappe.db.sql(query)
