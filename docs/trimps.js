"use strict";
// trimps.js: some code common to Perky and zFarm
var abs = Math.abs, ceil = Math.ceil, floor = Math.floor, log = Math.log, max = Math.max, min = Math.min, pow = Math.pow, round = Math.round, sqrt = Math.sqrt;
///
// HTML manipulation utilities
///
var $ = function (selector) { return document.querySelector(selector); };
var $$ = function (selector) { return [].slice.apply(document.querySelectorAll(selector)); };
function remove(elem) {
    elem.parentNode.removeChild(elem);
}
function switch_theme() {
    var dark = $('#dark');
    localStorage.dark = (dark.disabled = !dark.disabled) ? '' : '1';
}
function show_alert(style, message) {
    $('#alert').innerHTML +=
        "<p class=" + style + ">\n\t\t\t<span class=badge onclick='remove(this.parentNode)'>\u00D7</span>\n\t\t\t" + message + "\n\t\t</p>";
}
///
// Creating/loading share links
///
function create_share(callback) {
    var share_string = localStorage.notation + ':';
    share_string += $$('input,select').map(function (field) { return field.value.replace(':', ''); }).join(':');
    var long_url = location.href.replace(/[#?].*/, '');
    long_url += '?' + LZString.compressToBase64(share_string);
    var url = 'https://api-ssl.bitly.com/v3/shorten?longUrl=' + encodeURIComponent(long_url);
    url += '&login=grimy&apiKey=R_7ea82c1cec394d1ca5cf4da2a7f7ddd9';
    callback = callback || (function (url) { return show_alert('ok', "Your share link is <a href=" + url + ">" + url); });
    var request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.onload = function () { return callback(JSON.parse(request.responseText).data.url || long_url); };
    request.send();
}
function try_wrap(func) {
    try {
        func();
    }
    catch (err) {
        console.log(err);
        create_share(function (url) { return show_alert('ko', "Oops! It\u2019s not your fault, but something went wrong. You can go pester the dev on\n\t\t<a href=https://github.com/Grimy/Grimy.github.io/issues/new>GitHub</a> or\n\t\t<a href=https://www.reddit.com/message/compose/?to=Grimy_>Reddit</a>, he\u2019ll fix it.\n\t\tIf you do, please include the following message:\n\t\t<br><tt>" + url + " l" + (err.lineNumber || 0) + "c" + (err.columnNumber || 0) + " " + err + "</tt>."); });
    }
}
function exit_share() {
    history.pushState({}, '', 'perks.html');
    $('textarea').onclick = null;
    $$('[data-saved]').forEach(function (field) { return field.value = localStorage[field.id] || field.value; });
}
function load_share(str) {
    var values = LZString.decompressFromBase64(str).split(':');
    var notation = localStorage.notation;
    localStorage.notation = values.shift();
    $$('input,select').forEach(function (field) { return field.value = values.shift(); });
    $('textarea').onclick = exit_share;
    // try_main();
    localStorage.notation = notation || 1;
}
///
// Read/write notations for big numbers
///
var notations = [
    [],
    ('KMBTQaQiSxSpOcNoDcUdDdTdQadQidSxdSpdOdNdVUvDvTvQavQivSxvSpvOvNvTgUtgDtgTtgQatg' +
        'QitgSxtgSptgOtgNtgQaaUqaDqaTqaQaqaQiqaSxqaSpqaOqaNqaQiaUqiDqiTqiQaqiQiqiSxqiSpqi' +
        'OqiNqiSxaUsxDsxTsxQasxQisxSxsxSpsxOsxNsxSpaUspDspTspQaspQispSxspSpspOspNspOgUog' +
        'DogTogQaogQiogSxogSpogOogNogNaUnDnTnQanQinSxnSpnOnNnCtUc').split(/(?=[A-Z])/),
    [],
    ('a b c d e f g h i j k l m n o p q r s t u v w x y z' +
        ' aa ab ac ad ae af ag ah ai aj ak al am an ao ap aq ar as at au av aw ax ay az' +
        ' ba bb bc bd be bf bg bh bi bj bk bl bm bn bo bp bq br bs bt bu bv bw bx by bz' +
        ' ca cb cc cd ce cf cg ch ci cj ck cl cm cn co cp cq cr cs ct cu cv cw cx').split(' '),
    'KMBTQaQiSxSpOcNoDcUdDdTdQadQidSxdSpdOdNdVUvDvTvQavQivSxvSpvOvNvTt'.split(/(?=[A-Z])/),
];
function prettify(number) {
    if (number < 0)
        return '-' + prettify(-number);
    if (number < 10000)
        return +number.toPrecision(4) + '';
    if (localStorage.notation === '0')
        return number.toExponential(2).replace('+', '');
    var unit = 0;
    while (number >= 999.5) {
        number /= 1000;
        ++unit;
    }
    var suffixes = notations[localStorage.notation || 1];
    var suffix = unit > suffixes.length ? "e" + 3 * unit : suffixes[unit - 1];
    return +number.toPrecision(3) + suffix;
}
function parse_suffixes(str) {
    str = str.replace(/\*.*|[^--9+a-z]/gi, '');
    var suffixes = notations[localStorage.notation === '3' ? 3 : 1];
    for (var i = suffixes.length; i > 0; --i)
        str = str.replace(new RegExp(suffixes[i - 1] + '$', 'i'), "E" + 3 * i);
    return +str;
}
function input(id) {
    return parse_suffixes($('#' + id).value);
}
function check_input(field) {
    var ok = isFinite(parse_suffixes(field.value));
    var notation = localStorage.notation === '3' ? 'alphabetic ' : '';
    field.setCustomValidity(ok ? '' : "Invalid " + notation + "number: " + field.value);
}
///
// Handling Trimps save data
///
var game;
function handle_paste(ev) {
    var save_string = ev.clipboardData.getData("text/plain").replace(/\s/g, '');
    try {
        game = JSON.parse(LZString.decompressFromBase64(save_string));
        var version = 4.6;
        if (game.global.version > version)
            show_alert('warning', "This calculator only supports up to v" + version + " of Trimps, but your save is from v" + game.global.version + ". Results may be inaccurate.");
        else if (game.global.version < version)
            show_alert('ok', "Trimps v" + version + " is out! Your save is still on v" + game.global.version + ", so you should refresh the game\u2019s page.");
    }
    catch (err) {
        show_alert('ko', 'Your clipboard did not contain a valid Trimps save. Open the game, click “Export” then “Copy to Clipboard”, and try again.');
        return;
    }
    localStorage.notation = game.options.menu.standardNotation.enabled;
    for (var m in game.talents)
        game.talents[m] = game.talents[m].purchased;
}
window.onload = function () {
    var version = '2.3';
    $('#dark').disabled = !localStorage.dark;
    if (version > localStorage.version)
        show_alert('ok', "Welcome to Trimps tools v" + version + "! See what\u2019s new in the <a href=changelog.html>changelog</a>.");
    localStorage.version = version;
    if (location.search)
        load_share(location.search.substr(1));
    $$('[data-saved]').forEach(function (field) {
        if (field.type === 'checkbox') {
            field.checked = localStorage[field.id] === 'true';
            field.addEventListener('change', function () { return localStorage[field.id] = field.checked; });
        }
        else {
            field.value = localStorage[field.id] || field.value;
            field.addEventListener('change', function () { return localStorage[field.id] = field.value; });
        }
    });
};
