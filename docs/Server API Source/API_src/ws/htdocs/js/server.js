

//////////////////////////////////////////
$(document).ready( function() {

	//$("#se_msg").html(B_HTMLDecode(gMsg));
	
console.log('gUsers=', gUsers);
console.log('gCBs=', gCBs);

	var h = "", h2 = "";
	for (var acn in gUsers) {
		var user = gUsers[acn];
		var cnt = B_getLength(user.conns);
		var sun = user.sun;
		var a = [];
		if (cnt > 0) {
			for (var uid in user.conns) {
				var info = user.conns[uid];
				var h_pf = info.platform.indexOf("NUCloudPC") > -1 ? 'style="color:#00f;"'
						: info.platform.indexOf("IE") > -1 ? 'style="color:#f00;"'
						: '';
				a.push(
					'<tr>'
						+'<td style="min-width:32px;">'+info.uid+'</td>'
						//+'<td>'+info.readyState+'</td>'
						+'<td> - '+con_second2html(info.etime)+'</td>'
						+'<td> - '+info.ip+'</td>'
						+'<td>'+(info.server_acn!=""?' - '+info.server_acn:'')+'</td>'
						+'<td '+h_pf+'> - '+info.platform+'</td>'
						+'<td> - '+(info.os||"NULL")+'</td>'
						+'<td> - code:'+(info.nu_code && info.nu_code != "" ? "y" : "n")+'</td>'
					+'</tr>'
				)
			}
			h += '<tr>'
					+'<td width="180px;">'+acn+(user.online == true ? ' (online)':'')+'</td>'
					+'<td width="160px;">'+sun+'</td>'
					+'<td><table>'+a.join("")+'</table></td>'
				+'</tr>'
		}
		else {
			h2 += '<tr>'
					+'<td width="180px;">'+acn+'</td>'
					+'<td width="160px;">'+sun+'</td>'
					+'<td></td>'
				+'</tr>'
		}
	}
	$("#se_msg").html('<table cellpadding=1 cellspacing=1 border=1 >'+h+h2+'</table>');
	
});

function con_second2html(n)
{
	var dd, hh=0, mm, ss;
	n = parseInt(n/1000);
	ss = n%60;
	mm = parseInt(n/60);
	if (mm > 60) {
		n = mm;
		mm = n%60
		hh = parseInt(n/60);
	}
	if (hh > 24) {
		n = hh;
		hh = n%24;
		dd = parseInt(n/24);
	}
	return (dd?dd+'Day ':'')
			+(hh<10?'0':'')+hh+':'
			+(mm<10?'0':'')+mm+':'
			+(ss<10?'0':'')+ss
}
