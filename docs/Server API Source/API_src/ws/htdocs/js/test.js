
console.log(navigator);
console.log(location);

//////////////////////////////////////////
$(document).ready( function() {

console.log('HOST_NUNotice=', HOST_NUNotice);
console.log('API_NUNotice=', API_NUNotice);

console.log('B_getBrowserName=', B_getBrowserName());

	// 重新連線
	$("#bnConn").on("click", function(){
		var acn = $.trim($("#user_acn").val());
		var sun = $.trim($("#user_sun").val());
		
		oWS.close();
		if (acn != "" && sun != "") {
			setTimeout(function(){
				oWS.init({acn:acn, sun:sun});
			}, 100);
			
			
			
		}
		else
			$("#se_ws_msg").html("Error: empty acn or sun");
	});
	// 測試連線
	$("#bnTextConn").on("click", function(){
		var acn = $.trim($("#user_acn").val());
		var sun = $.trim($("#user_sun").val());
		
		var websocket;
		try {
			websocket = new WebSocket(oWS.m_wsUri, oWS.m_wsProtocol); 
		} catch(e) {
			websocket.onClose();
			return;
		}
		websocket.onopen 	= function(evt) {
			console.log('!!!!!!!!!!!!!! websocket.onopen');
		} 
		websocket.onclose 	= function(evt) {
			console.log('!!!!!!!!!!!!!! websocket.onclose');
		} 
		websocket.onmessage = function(evt) {
			console.log('!!!!!!!!!!!!!! websocket.onmessage');
		} 
		websocket.onerror 	= function(evt) {
			console.log('!!!!!!!!!!!!!! websocket.onerror');
		} 
	});
	
	function nunotice_get(){
		var url = $.trim($("#nunotice_url").val());
		var url_type = $.trim($("#nunotice_url_type").val());
		var allow = $.trim($("#nunotice_allow").val());
		var title = $.trim($("#nunotice_title").val());
		var content = $.trim($("#nunotice_content").val());
		$("#nunotice_data").html(
			'{'
			+'"owner":"'+oWS.m_arg.acn+'"'
			+'\r\n,"url":"'+url+'"'
			+'\r\n,"url_type":"'+url_type+'"'
			+'\r\n,"allow":'+allow
			+'\r\n,"title":"'+title+'-'+B_getCurrentTimeStr(null,6)+'"'
			+'\r\n,"content":"'+content+'"'
			+'\r\n,"time":"'+B_getCurrentTimeStr(null,1)+'"'
			+'}'
		);
		
		
		
	}
	$("#bnNUNoticeGet").on("click", nunotice_get);
	$("#nunotice_form").on("submit", function(){
		if (!oWS.m_arg || (oWS.m_arg.acn||"") == "") {
			$("#nunotice_data").append("Error: Empty acn");
			return false;
		}
		nunotice_get();
		//return false;
	})
});