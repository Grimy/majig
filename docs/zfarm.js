"use strict";function remove(a){a.parentNode.removeChild(a)}function switch_theme(){var a=$("#dark");localStorage.dark=(a.disabled=!a.disabled)?"":"1"}function show_alert(a,b){$("#alert").innerHTML+="<p class="+a+">\n			<span class=badge onclick='remove(this.parentNode)'>×</span>\n			"+b+"\n		</p>"}function create_share(a){var b=localStorage.notation+":";b+=$$("input,select").map(function(a){return a.value.replace(":","")}).join(":");var c=location.href.replace(/[#?].*/,"");c+="?"+LZString.compressToBase64(b);var d="https://api-ssl.bitly.com/v3/shorten?longUrl="+encodeURIComponent(c);d+="&login=grimy&apiKey=R_7ea82c1cec394d1ca5cf4da2a7f7ddd9",a=a||function(a){return show_alert("ok","Your share link is <a href="+a+">"+a)};var e=new XMLHttpRequest;e.open("GET",d,!0),e.onload=function(){return a(JSON.parse(e.responseText).data.url||c)},e.send()}function try_wrap(a){try{a()}catch(b){console.log(b),create_share(function(a){return show_alert("ko","Oops! It’s not your fault, but something went wrong. You can go pester the dev on\n		<a href=https://github.com/Grimy/Grimy.github.io/issues/new>GitHub</a> or\n		<a href=https://www.reddit.com/message/compose/?to=Grimy_>Reddit</a>, he’ll fix it.\n		If you do, please include the following message:\n		<br><tt>"+a+" l"+(b.lineNumber||0)+"c"+(b.columnNumber||0)+" "+b+"</tt>.")})}}function exit_share(){history.pushState({},"","perks.html"),$("textarea").onclick=null,$$("[data-saved]").forEach(function(a){return a.value=localStorage[a.id]||a.value})}function load_share(a){var b=LZString.decompressFromBase64(a).split(":"),c=localStorage.notation;localStorage.notation=b.shift(),$$("input,select").forEach(function(a){return a.value=b.shift()}),$("textarea").onclick=exit_share,localStorage.notation=c||1}function prettify(a){if(0>a)return"-"+prettify(-a);if(1e4>a)return+a.toPrecision(4)+"";if("0"===localStorage.notation)return a.toExponential(2).replace("+","");for(var b=0;a>=999.5;)a/=1e3,++b;var c=notations[localStorage.notation||1],d=b>c.length?"e"+3*b:c[b-1];return+a.toPrecision(3)+d}function parse_suffixes(a){a=a.replace(/\*.*|[^--9+a-z]/gi,"");for(var b=notations["3"===localStorage.notation?3:1],c=b.length;c>0;--c)a=a.replace(new RegExp(b[c-1]+"$","i"),"E"+3*c);return+a}function input(a){return parse_suffixes($("#"+a).value)}function check_input(a){var b=isFinite(parse_suffixes(a.value)),c="3"===localStorage.notation?"alphabetic ":"";a.setCustomValidity(b?"":"Invalid "+c+"number: "+a.value)}function handle_paste(a){var b=a.clipboardData.getData("text/plain").replace(/\s/g,"");try{game=JSON.parse(LZString.decompressFromBase64(b));var c=4.6;game.global.version>c?show_alert("warning","This calculator only supports up to v"+c+" of Trimps, but your save is from v"+game.global.version+". Results may be inaccurate."):game.global.version<c&&show_alert("ok","Trimps v"+c+" is out! Your save is still on v"+game.global.version+", so you should refresh the game’s page.")}catch(d){return void show_alert("ko","Your clipboard did not contain a valid Trimps save. Open the game, click “Export” then “Copy to Clipboard”, and try again.")}localStorage.notation=game.options.menu.standardNotation.enabled;for(var e in game.talents)game.talents[e]=game.talents[e].purchased}function read_save(){for(var a=0,b=0,c=["Chronoimp","Jestimp","Titimp","Flutimp","Goblimp"];b<c.length;b++){var d=c[b];a+=game.unlocks.imps[d]}var e=game.portal.Relentlessness.level,f=game.global.challengeActive,g=game.global.soldierCurrentAttack,h=.8+.02*game.portal.Range.level,i=1.2,j=1,k=game.global.world,l=game.global.highestLevelCleared>=109,m=game.empowerments[["Poison","Wind","Ice"][ceil(k/5)%3]],n=game.talents.nature3?5:0,o=10*pow(.95,game.portal.Agility.level)-game.talents.hyperspeed;if(game.talents.hyperspeed2&&k<=ceil(game.global.highestLevelCleared/2)&&--o,g*=1+.02*game.global.antiStacks*game.portal.Anticipation.level,g*=1+.01*game.global.achievementBonus,g*=1+.2*game.global.roboTrimpLevel,g*=1+game.goldenUpgrades.Battle.currentBonus,g*=1+.01*game.global.totalSquaredReward,g/=[1,.5,4,.5,.5][game.global.formation],game.global.sugarRush>0&&(g*=floor(k/100)),game.talents.stillRowing2&&(g*=1+.06*game.global.spireRows),game.talents.magmamancer){var p=((new Date).getTime()-game.global.zoneStarted)/6e4,q=pow(1.2,min(12,floor((p+5)/10)))-1;g*=1+3*(1-pow(.9999,game.jobs.Magmamancer.owned))*q}if(game.talents.healthStrength){var r=min(k,100*game.global.lastSpireCleared+199),s=300>r?0:floor((r-270)/15);g*=1+.15*s}if("Discipline"===f)h=.005,i=1.995;else if("Balance"===f||"Meditate"===f||"Toxicity"===f)j*=2;else if("Daily"===f){var t=function(a){return game.global.dailyChallenge[a]?game.global.dailyChallenge[a].strength:0};j*=1+.2*t("badHealth"),j*=1+.3*t("badMapHealth"),h-=t("minDamage")?.09+.01*t("minDamage"):0,i+=t("maxDamage"),g*=1-.09*t("weakness"),g*=1+.1*ceil(t("rampage")/10)*(1+t("rampage")%10),g*=k%2==1?1-.02*t("oddTrimpNerf"):1+.2*t("evenTrimpBuff")}else"Life"===f?(j*=11,g*=1+.1*game.challenges.Life.stacks):"Lead"===f?(k%2==1?g*=1.5:show_alert("warning","Are you <b>sure</b> you want to farm on an even Lead zone?"),j*=1+.04*game.challenges.Lead.stacks):"Obliterated"===f&&(j*=pow(10,12+floor(k/10)));$("#attack").value=prettify(g*h),$("#cc").value=5*e+game.heirlooms.Shield.critChance.currentBonus,$("#cd").value=100+30*e+game.heirlooms.Shield.critDamage.currentBonus,$("#challenge").value=prettify(j),$("#coordinate").checked="Coordinate"===f,$("#difficulty").value=l?75:80,$("#fragments").value=prettify(game.resources.fragments.owned),$("#imports").value=a,$("#nature").value=k>=236?m.level+n:0,$("#overkill").value=game.portal.Overkill.level,$("#range").value=+(i/h).toPrecision(5),$("#reducer").checked=game.talents.mapLoot,$("#scry").checked=game.global.highestLevelCleared>=180,$("#size").value=game.talents.mapLoot2?20:l?25:27,$("#speed").value=prettify(o),$("#titimp").checked=game.unlocks.imps.Titimp,$("#transfer").value=k>=236?m.retainLevel+n:0,$("#zone").value=k}function get_best(a,b){for(var c={overall:"",stance:"",second:"",second_stance:"",ratio:0},d=function(b){a.sort(function(a,c){return c[b].value-a[b].value}),c[b]=a[0].zone},e=0,f=b;e<f.length;e++){var g=f[e];d(g)}return a.sort(function(a,b){return b.value-a.value}),c.overall=a[0].zone,c.stance=a[0].stance,a[1]&&(c.second=a[1].zone,c.second_stance=a[1].stance,c.ratio=a[0].value/a[1].value),c}function display(a){var b=a[0],c=a[1];if(0===b.length)return void show_alert("ko","Your attack is too low to farm anywhere.");var d=get_best(b.slice(),c),e=$("#zone").value>=60,f="";c.length>1&&(f+="<tr><th colspan=2>"+c.replace(/(?!$)/g,"<th colspan=2>")+"</tr>"),f+="<tr><th>Level<th>Base loot";for(var g=0,h=c;g<h.length;g++){h[g];f+="<th>Cells/s<th>Total"}for(var i=0,j=b;i<j.length;i++){var k=j[i],l=k.zone;f+="</tr><tr><td class=align-right>";for(var m=0,n=c;m<n.length;m++){var o=n[m];l===d[o]&&e&&(f+="<b>"+o+"</b> ")}f+=l===d.overall?"<b>"+l+"</b>":l,f+="<td>"+prettify(k.loot)+"%";for(var p=0,q=c;p<q.length;p++){var o=q[p],r=prettify(k[o].value);f+="<td>"+k[o].speed.toFixed(3)+"<td>",f+=l===d[o]?"<b>"+r+"</b>":r}}if($("#details").innerHTML=f+"</tr>",$("#results").style.opacity=1,e&&(d.overall+=" in "+d.stance,d.second+=" in "+d.second_stance),1==b.length)return void($("#zone").value%100===0&&$("#zone").value>100?($("#result").textContent="You should definitely farm on "+d.overall,$("#comment").textContent="Good luck with the Spire!"):($("#result").textContent="You should really be pushing rather than farming",$("#comment").textContent=""));var s=100*(d.ratio-1),t=[""," probably",""," really"," definitely"][min(floor(s/2),4)];$("#result").textContent="You should "+t+" farm on "+d.overall,2>s&&($("#result").textContent+=" or "+d.second),$("#comment").textContent=2>s?"They’re equally efficient.":4>s?"But "+d.second+" is almost as good.":"It’s "+s.toFixed(1)+"% more efficient than "+d.second+"."}function main(){display(stats(parse_inputs()))}function rng(){return seed^=seed>>11,seed^=seed<<8,seed^=seed>>19}function enemy_hp(a,b,c){var d=14.3*sqrt(b*pow(3.265,b))-12.1;return d*=60>b?3+3/110*c:(5+.08*c)*pow(1.1,b-59),a.zone>=230&&(d*=round(50*pow(1.05,floor(a.zone/6-25)))/10),a.difficulty*a.challenge*d}function simulate(a,b){for(var c=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0;max_ticks>j;++e){var k=void 0,l=void 0;e%a.size===99?(k=max_rand,l=2.9):(k=rng(),l=k<a.import_chance?1:a.biome[k%a.biome.length]);var m=l*enemy_hp(a,b,e%a.size);e%a.size!==0&&(m-=min(d,m));for(var n=0;m>0;){++n;var o=a.atk*(1+a.range*rng());o*=rng()<a.cc?a.cd:1,o*=c>j?2:1,o*=2-pow(.366,i*a.ice),m-=o+g*a.poison,g+=o,++i}h=min(h+n,200),f+=1+h*a.wind,d=-m*a.overkill,j+=+(n>0)+ +(a.speed>9)+ceil(n*a.speed),a.titimp&&.03*max_rand>k&&(c=min(max(j,c)+300,j+450)),g=ceil(a.transfer*g)+1,h=ceil(a.transfer*h)+1,i=ceil(a.transfer*i)+1}return 10*f/max_ticks}function zone_stats(a,b,c){for(var d={zone:"z"+a,value:0,stance:"",loot:100*(a<c.zone?pow(.8,c.zone-c.reducer-a):pow(1.1,a-c.zone))},e=0,f=b;e<f.length;e++){var g=f[e];c.atk=c.attack*("D"==g?4:"X"==g?1:.5);var h=simulate(c,a),i=h*d.loot*("S"==g?2:1);d[g]={speed:h,value:i},i>d.value&&(d.value=i,d.stance=g)}return d}function map_cost(a,b){return a+=b,a*pow(1.14,a)*b*pow(1.03+b/5e4,b)/42.75}function stats(a){for(var b=[],c=(a.zone<70?"X":"D")+(a.scry&&a.zone>=60?"S":""),d=0;10>d&&a.fragments>map_cost(53.98+10*d,a.zone);)++d;d=d||-a.reducer;for(var e=1;e<=a.zone+d;++e){var f=a.attack/(max.apply(0,a.biome)*enemy_hp(a,e,a.size-1));if(.001>f)break;e>=6&&(2>f||e==a.zone+d)&&b.push(zone_stats(e,c,a)),a.coordinate&&(a.challenge=ceil(1.25*a.challenge))}return[b,c]}var LZString=function(){function a(a,b){if(!e[a]){e[a]={};for(var c=0;c<a.length;c++)e[a][a[c]]=c}return e[a][b]}var b=String.fromCharCode,c="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",d="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-$",e={},f=function(){return new Map};if("undefined"==typeof Map){var g=function(){this.data={}};g.prototype.get=function(a){return this.data.hasOwnProperty(a)?this.data[a]:null},g.prototype.set=function(a,b){this.data[a]=b},g.prototype.has=function(a){return this.data.hasOwnProperty(a)},g.prototype["delete"]=function(a){delete this.data[a]},f=function(){return new g}}var h={compressToBase64:function(a){if(null==a)return"";var b=h._compress(a,6,function(a){return c.charAt(a)});switch(b.length%4){default:case 0:return b;case 1:return b+"===";case 2:return b+"==";case 3:return b+"="}},decompressFromBase64:function(b){return null==b?"":""==b?null:h._decompress(b.length,32,function(d){return a(c,b.charAt(d))})},compressToUTF16:function(a){return null==a?"":h._compress(a,15,function(a){return b(a+32)})+" "},decompressFromUTF16:function(a){return null==a?"":""==a?null:h._decompress(a.length,16384,function(b){return a.charCodeAt(b)-32})},compressToUint8Array:function(a){for(var b=h.compress(a),c=new Uint8Array(2*b.length),d=0,e=b.length;e>d;d++){var f=b.charCodeAt(d);c[2*d]=f>>>8,c[2*d+1]=f%256}return c},decompressFromUint8Array:function(a){if(null===a||void 0===a)return h.decompress(a);for(var c=new Array(a.length/2),d=0,e=c.length;e>d;d++)c[d]=256*a[2*d]+a[2*d+1];var f=[];return c.forEach(function(a){f.push(b(a))}),h.decompress(f.join(""))},compressToEncodedURIComponent:function(a){return null==a?"":h._compress(a,6,function(a){return d.charAt(a)})},decompressFromEncodedURIComponent:function(b){return null==b?"":""==b?null:(b=b.replace(/ /g,"+"),h._decompress(b.length,32,function(c){return a(d,b.charAt(c))}))},compress:function(a){return h._compress(a,16,function(a){return b(a)})},_compress:function(a,b,c){if(null==a)return"";var d,e,g,h=f(),i=f(),j="",k="",l="",m=2,n=3,o=2,p=[],q=0,r=0;for(g=0;g<a.length;g+=1)if(j=a[g],h.has(j)||(h.set(j,n++),i.set(j,!0)),k=l+j,h.has(k))l=k;else{if(i.has(l)){if(l.charCodeAt(0)<256){for(d=0;o>d;d++)q<<=1,r==b-1?(r=0,p.push(c(q)),q=0):r++;for(e=l.charCodeAt(0),d=0;8>d;d++)q=q<<1|1&e,r==b-1?(r=0,p.push(c(q)),q=0):r++,e>>=1}else{for(e=1,d=0;o>d;d++)q=q<<1|e,r==b-1?(r=0,p.push(c(q)),q=0):r++,e=0;for(e=l.charCodeAt(0),d=0;16>d;d++)q=q<<1|1&e,r==b-1?(r=0,p.push(c(q)),q=0):r++,e>>=1}m--,0==m&&(m=Math.pow(2,o),o++),i["delete"](l)}else for(e=h.get(l),d=0;o>d;d++)q=q<<1|1&e,r==b-1?(r=0,p.push(c(q)),q=0):r++,e>>=1;m--,0==m&&(m=Math.pow(2,o),o++),h.set(k,n++),l=String(j)}if(""!==l){if(i.has(l)){if(l.charCodeAt(0)<256){for(d=0;o>d;d++)q<<=1,r==b-1?(r=0,p.push(c(q)),q=0):r++;for(e=l.charCodeAt(0),d=0;8>d;d++)q=q<<1|1&e,r==b-1?(r=0,p.push(c(q)),q=0):r++,e>>=1}else{for(e=1,d=0;o>d;d++)q=q<<1|e,r==b-1?(r=0,p.push(c(q)),q=0):r++,e=0;for(e=l.charCodeAt(0),d=0;16>d;d++)q=q<<1|1&e,r==b-1?(r=0,p.push(c(q)),q=0):r++,e>>=1}m--,0==m&&(m=Math.pow(2,o),o++),i["delete"](l)}else for(e=h.get(l),d=0;o>d;d++)q=q<<1|1&e,r==b-1?(r=0,p.push(c(q)),q=0):r++,e>>=1;m--,0==m&&(m=Math.pow(2,o),o++)}for(e=2,d=0;o>d;d++)q=q<<1|1&e,r==b-1?(r=0,p.push(c(q)),q=0):r++,e>>=1;for(;;){if(q<<=1,r==b-1){p.push(c(q));break}r++}return p.join("")},decompress:function(a){return null==a?"":""==a?null:h._decompress(a.length,32768,function(b){return a.charCodeAt(b)})},_decompress:function(a,c,d){var e,g,h,i,j,k,l,m,n=f(),o=4,p=4,q=3,r="",s=[],t={val:d(0),position:c,index:1};for(g=0;3>g;g+=1)n.set(g,g);for(i=0,k=Math.pow(2,2),l=1;l!=k;)j=t.val&t.position,t.position>>=1,0==t.position&&(t.position=c,t.val=d(t.index++)),i|=(j>0?1:0)*l,l<<=1;switch(e=i){case 0:for(i=0,k=Math.pow(2,8),l=1;l!=k;)j=t.val&t.position,t.position>>=1,0==t.position&&(t.position=c,t.val=d(t.index++)),i|=(j>0?1:0)*l,l<<=1;m=b(i);break;case 1:for(i=0,k=Math.pow(2,16),l=1;l!=k;)j=t.val&t.position,t.position>>=1,0==t.position&&(t.position=c,t.val=d(t.index++)),i|=(j>0?1:0)*l,l<<=1;m=b(i);break;case 2:return""}for(n.set(3,m),h=m,s.push(m);;){if(t.index>a)return"";for(i=0,k=Math.pow(2,q),l=1;l!=k;)j=t.val&t.position,t.position>>=1,0==t.position&&(t.position=c,t.val=d(t.index++)),i|=(j>0?1:0)*l,l<<=1;switch(m=i){case 0:for(i=0,k=Math.pow(2,8),l=1;l!=k;)j=t.val&t.position,t.position>>=1,0==t.position&&(t.position=c,t.val=d(t.index++)),i|=(j>0?1:0)*l,l<<=1;n.set(p++,b(i)),m=p-1,o--;break;case 1:for(i=0,k=Math.pow(2,16),l=1;l!=k;)j=t.val&t.position,t.position>>=1,0==t.position&&(t.position=c,t.val=d(t.index++)),i|=(j>0?1:0)*l,l<<=1;n.set(p++,b(i)),m=p-1,o--;break;case 2:return s.join("")}if(0==o&&(o=Math.pow(2,q),q++),n.get(m))r=n.get(m);else{if(m!==p)return null;r=h+h[0]}s.push(r),n.set(p++,h+r[0]),o--,h=r,0==o&&(o=Math.pow(2,q),q++)}}};return h}();"function"==typeof define&&define.amd?define(function(){return LZString}):"undefined"!=typeof module&&null!=module&&(module.exports=LZString);var abs=Math.abs,ceil=Math.ceil,floor=Math.floor,log=Math.log,max=Math.max,min=Math.min,pow=Math.pow,round=Math.round,sqrt=Math.sqrt,$=function(a){return document.querySelector(a)},$$=function(a){return[].slice.apply(document.querySelectorAll(a))};$("#dark").disabled=!localStorage.dark;var notations=[[],"KMBTQaQiSxSpOcNoDcUdDdTdQadQidSxdSpdOdNdVUvDvTvQavQivSxvSpvOvNvTgUtgDtgTtgQatgQitgSxtgSptgOtgNtgQaaUqaDqaTqaQaqaQiqaSxqaSpqaOqaNqaQiaUqiDqiTqiQaqiQiqiSxqiSpqiOqiNqiSxaUsxDsxTsxQasxQisxSxsxSpsxOsxNsxSpaUspDspTspQaspQispSxspSpspOspNspOgUogDogTogQaogQiogSxogSpogOogNogNaUnDnTnQanQinSxnSpnOnNnCtUc".split(/(?=[A-Z])/),[],"a b c d e f g h i j k l m n o p q r s t u v w x y z aa ab ac ad ae af ag ah ai aj ak al am an ao ap aq ar as at au av aw ax ay az ba bb bc bd be bf bg bh bi bj bk bl bm bn bo bp bq br bs bt bu bv bw bx by bz ca cb cc cd ce cf cg ch ci cj ck cl cm cn co cp cq cr cs ct cu cv cw cx".split(" "),"KMBTQaQiSxSpOcNoDcUdDdTdQadQidSxdSpdOdNdVUvDvTvQavQivSxvSpvOvNvTt".split(/(?=[A-Z])/)],game;window.onload=function(){var a="2.3";a>localStorage.version&&show_alert("ok","Welcome to Trimps tools v"+a+"! See what’s new in the <a href=changelog.html>changelog</a>."),localStorage.version=a,location.search&&load_share(location.search.substr(1)),$$("[data-saved]").forEach(function(a){"checkbox"===a.type?(a.checked="true"===localStorage[a.id],a.addEventListener("change",function(){return localStorage[a.id]=a.checked})):(a.value=localStorage[a.id]||a.value,a.addEventListener("change",function(){return localStorage[a.id]=a.value}))})};var parse_inputs=function(){return a={attack:input("attack"),biome:biomes.all.concat(biomes[$("#biome").value]),cc:$("#cc").value/100*max_rand,cd:1+$("#cd").value/100,challenge:input("challenge"),coordinate:$("#coordinate").checked,difficulty:$("#difficulty").value/100,fragments:input("fragments"),import_chance:.03*$("#imports").value*max_rand,overkill:.005*$("#overkill").value,range:($("#range").value-1)/max_rand,reducer:$("#reducer").checked,scry:$("#scry").checked,size:0|$("#size").value,speed:input("speed"),titimp:$("#titimp").checked,transfer:$("#transfer").value/100,zone:0|$("#zone").value,poison:0,wind:0,ice:0},a[["poison","wind","ice"][ceil(input("zone")/5)%3]]=$("#nature").value/100,a;var a},max_ticks=864e3,test=[1,2],biomes={all:[.7,1.3,1.3,1,.7,.8,1.1],gardens:[.95,.95,1,.8,1.3,1.1,1.4],sea:[.9,1.1,1.1],mountain:[2,1.4,1.4],forest:[1.2,1.5],depths:[1,.7,1.4,.8]},seed=42,max_rand=pow(2,31);