// Copyright (c) 2023, jam and contributors
// For license information, please see license.txt

frappe.ui.form.on('Poll', {
	onload: function(frm) {
		setup_publish_realtime_for_live_poll(frm);
	},
	refresh: function(frm) {
		if(frm.doc.owner != frappe.session.user){
				frm.disable_form();
		}
		set_mark_opinion_html(frm);
		if(frm.doc.is_private_poll){
				send_poll_btn(frm, "Live Poll", "the live poll promt to all live users", "send_live_poll")
				send_poll_btn(frm, "Poll Notification", "the notification go to all system users", "send_poll_notification")
		}
	},
	is_private_poll: function(frm) {
		frm.set_value("is_live_poll", false);
	}
});

var set_mark_opinion_html = function(frm) {
	var $wrapper = frm.fields_dict['mark_opinion_html'].$wrapper;
	var field_html = '<div>';
	if(frm.doc.options && frm.doc.options.length > 0){
		field_html += `
			<span>
				<b>Select your opinion from the list</b>
			</span>
			<br/><br/>
		`;
		frm.doc.options.forEach((option, i) => {
			field_html += `
				<div class="row">
					<div class="col-sm-10">
						<span>${option.option}</span>
					</div>
					<div class="col-sm-2">
						<button class="btn btn-secondary" selected-opinion="${option.option}" poll="${frm.doc.name}">Vote</button>
					</div>
				</div>
				<br/>
			`;
		});
	}
	field_html += '</div>'
	$wrapper
		.html(field_html);

	// highlight button when clicked
	$wrapper.on('click', 'button', function() {
		let $btn = $(this);
		$wrapper.find('button').removeClass('btn-outline-primary');
		$btn.addClass('btn-outline-primary');
		frappe.confirm(__("Your vote for {0}! Do you want to continue?", [$btn.attr('selected-opinion')]),
			function() {
				frappe.call({
					method: 'opn_heimer.opinion_heimer.doctype.poll.poll.mark_opinion',
					args: {
						'poll': $btn.attr('poll'),
						'opinion': $btn.attr('selected-opinion')
					},
					callback: function(r) {
						if(r.message && r.message.name){
							frappe.show_alert({
									message:__('You opinion is marked!'),
									indicator:'green'
							});
						}
					}
				});
			},
			function() {
				console.log("No");
			}
		)
	});
}

var send_poll_btn = function(frm, poll_type, confirm_msg, send_poll_method) {
	if(!frm.is_new() && frm.doc.is_private_poll == 1){
		frm.add_custom_button(__("Send {0}", [poll_type]), function() {
			if(frm.is_dirty()){
				frappe.throw(__('Please Save the Document and Continue!'))
			}
			else{
				if(!frm.doc.users || frm.doc.users.length < 1){
					frappe.confirm(__("Since no users selected, {0}! Do you want to continue?", [confirm_msg]),
						function() {
							send_poll(frm, send_poll_method);
						},
						function() {
							frm.scroll_to_field("users");
						}
					)
				}
				else{
					send_poll(frm, send_poll_method);
				}
			}
		}, __("Send"))
	}
}

var send_poll = function(frm, send_poll_method) {
	frappe.call({
		doc: frm.doc,
		method: send_poll_method,
		callback: function(r) {
			// console.log(r);
		}
	});
}

var setup_publish_realtime_for_live_poll = function(frm) {
	frappe.realtime.on('heimer_live_poll_event', function(data) {
		let selected_opinion = "";
		let poll = "";
		let d = new frappe.ui.Dialog({
			title: data.title?data.title:'Let`s Poll',
			fields: [
				{
					fieldname: 'content',
					fieldtype: 'HTML'
				}
			],
			primary_action_label: 'Submit',
			primary_action() {
				frappe.call({
					method: 'opn_heimer.opinion_heimer.doctype.poll.poll.mark_opinion',
					args: {
						'poll': poll,
						'opinion': selected_opinion
					},
					callback: function(r) {
						console.log(r);
					}
				});
				d.hide();
			}
		});

		// disable dialog action initially
		d.get_primary_btn().attr('disabled', true);

		d.fields_dict.content.$wrapper.html(data.content);

		let $wrapper = d.fields_dict.content.$wrapper;

		// highlight button when clicked
		$wrapper.on('click', 'button', function() {
			let $btn = $(this);
			$wrapper.find('button').removeClass('btn-outline-primary');
			$btn.addClass('btn-outline-primary');
			poll = $btn.attr('poll');
			selected_opinion = $btn.attr('selected-opinion');
			// enable primary action 'Book'
			d.get_primary_btn().attr('disabled', false);
		});

		d.show();
	});
};
