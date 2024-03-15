// dom ready
document.addEventListener("DOMContentLoaded", (event)=>{
	setTimeout(()=>{
		setup_publish_realtime_poll();
  }, 5000)
});

var setup_publish_realtime_poll = function() {
	frappe.realtime.on('heimer_realtime_poll_event', function(data) {
		mark_opinion_dialog(data, 'Realtime Opinion');
	});
};

var mark_opinion_dialog = function(data, source) {
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
					// 
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
