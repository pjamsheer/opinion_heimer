// Copyright (c) 2023, jam and contributors
// For license information, please see license.txt

frappe.ui.form.on('Poll', {
	onload: function(frm) {
		setup_publish_realtime_poll(frm);
	},
	refresh: function(frm) {
		if(frm.doc.owner != frappe.session.user){
			frm.disable_form();
			frm.events.get_mark_opinion_dialog(frm, 'Desk Form');
		}
		else if(frm.doc.is_private_poll){
			get_opinion_btn(frm, "Realtime", "the realtime poll promt to all live users", "send_poll_realtime_notification")
			get_opinion_btn(frm, "Through System Notification", "the notification go to all system users", "send_poll_system_notification")
		}
	},
	mark_my_opinion: function(frm) {
		frm.events.get_mark_opinion_dialog(frm, 'My Opinion Button');
	},
	get_mark_opinion_dialog: function(frm, source) {
		frappe.call({
			doc: frm.doc,
			method: 'show_mark_opinion_dialog_on_form',
			callback: function(r) {
				if(r.message){
					mark_opinion_dialog(frm, r.message, source);
				}
				else {
					frm.set_df_property('mark_my_opinion', 'label', 'Your opinion is marked!')
				}
			}
		})
	}
});

var get_opinion_btn = function(frm, poll_type, confirm_msg, send_poll_method) {
	if(!frm.is_new() && frm.doc.is_private_poll == 1){
		frm.add_custom_button(__("{0}", [poll_type]), function() {
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
		}, __("Get Opinion"))
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

var setup_publish_realtime_poll = function(frm) {
	frappe.realtime.on('heimer_realtime_poll_event', function(data) {
		mark_opinion_dialog(frm, data, 'Realtime Opinion');
	});
};

var mark_opinion_dialog = function(frm, data, source) {
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
				method: 'opinion_heimer.opinion_heimer.doctype.poll.poll.mark_opinion',
				args: {
					'poll': poll,
					'opinion': selected_opinion,
					'source': source
				},
				callback: function(r) {
					if(frm.doc.doctype == 'Poll' && frm.doc.name == poll){
						frm.refresh();
					}
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
}
