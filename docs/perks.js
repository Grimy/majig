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
/// <reference path="./trimps.ts"/>
var Perk = /** @class */ (function () {
    function Perk(name, base_cost, increment, cap, free) {
        this.name = name;
        this.base_cost = base_cost;
        this.increment = increment;
        this.cap = cap;
        this.free = free;
        this.locked = true;
        this.level = 0;
        this.pack = 1;
        this.must = 0;
        this.spent = 0;
    }
    // Compute the current cost of a perk, based on its current level.
    Perk.prototype.cost = function () {
        return this.increment ?
            this.pack * (this.base_cost + this.increment * (this.level + (this.pack - 1) / 2)) :
            ceil(this.level / 2 + this.base_cost * mult(this, 30));
    };
    return Perk;
}());
function validate_fixed() {
    try {
        parse_perks($('#fixed').value, 'l');
        $('#fixed').setCustomValidity('');
    }
    catch (err) {
        $('#fixed').setCustomValidity(err);
    }
}
validate_fixed();
var presets = {
    pick: ['', '', ''],
    early: [5, 4, 2],
    broken: [7, 3, 1],
    mid: [16, 5, 1],
    corruption: [25, 7, 1],
    magma: [35, 4, 3],
    z280: [42, 6, 1],
    z400: [88, 10, 1],
    z450: [500, 50, 1],
    spire: [0, 1, 1],
    nerfed: [0, 4, 3],
    tent: [5, 4, 3],
    scientist: [0, 1, 3],
    carp: [0, 0, 0],
    trapper: [0, 7, 1],
    coord: [0, 40, 1],
    trimp: [0, 99, 1],
    metal: [0, 7, 1],
    c2: [0, 7, 1],
};
function select_preset(name) {
    var preset = presets[name];
    function special(regex, field, prefix) {
        field.value = field.value.replace(prefix, '');
        if (name.match(regex))
            field.value = prefix + field.value;
    }
    special(/spire|metal|trapper|carp/, $('#prod'), '0*');
    special(/spire|carp/, $('#loot'), '0*');
    special(/spire/, $('#fixed'), 'overkill=0,');
    special(/nerfed/, $('#fixed'), 'overkill=1,');
    special(/scientist/, $('#fixed'), 'coord=0,');
    special(/trapper/, $('#fixed'), 'phero=0,anti=0,');
    $('#weight-he').value = preset[0], $('#weight-atk').value = preset[1], $('#weight-hp').value = preset[2];
}
function handle_respec(respec) {
    var owned = game ? game.resources.helium.owned : 0;
    $('#helium').value = input('helium') + owned * (respec ? -1 : 1);
}
function update_dg() {
    var max_zone = $('#zone').value / 2 + 115;
    var eff = 500e6 + 50e6 * game.generatorUpgrades.Efficiency.upgrades;
    var capa = 3 + 0.4 * game.generatorUpgrades.Capacity.upgrades;
    var max_fuel = game.permanentGeneratorUpgrades.Storage.owned ? capa * 1.5 : capa;
    var supply = 230 + 2 * game.generatorUpgrades.Supply.upgrades;
    var overclock = game.generatorUpgrades.Overclocker.upgrades;
    overclock = overclock && (1 - 0.5 * pow(0.99, overclock - 1));
    var burn = game.permanentGeneratorUpgrades.Slowburn.owned ? 0.4 : 0.5;
    var cells = game.talents.magmaFlow ? 18 : 16;
    var accel = game.talents.quickGen ? 1.03 : 1.02;
    var speed = game.talents.hyperspeed ? 20 : 25;
    var hs2 = game.talents.hyperspeed2 ? (game.global.highestLevelCleared + 1) / 2 : 0;
    var bs = 0.5 * game.talents.blacksmith + 0.25 * game.talents.blacksmith2 + 0.15 * game.talents.blacksmith3;
    bs *= game.global.highestLevelCleared + 1;
    var housing = 0;
    var fuel = 0;
    var time = 0;
    function tick(mult) {
        housing += mult * eff * sqrt(min(capa, fuel));
        fuel -= burn;
    }
    for (var zone = 230; zone <= max_zone; ++zone) {
        fuel += cells * (0.01 * min(zone, supply) - 2.1);
        var tick_time = ceil(60 / pow(accel, floor((zone - 230) / 3)));
        time += zone > bs ? 28 : zone > hs2 ? 20 : 15;
        while (time >= tick_time) {
            time -= tick_time;
            tick(1);
        }
        while (fuel > max_fuel)
            tick(overclock);
        housing *= 1.009;
    }
    while (fuel >= burn)
        tick(1);
    $("#dg").value = floor(housing);
}
function read_save() {
    // Auto-fill for the lazy
    if (!localStorage.zone)
        $('#zone').value = game.stats.highestVoidMap.valueTotal;
    var zone = $('#zone').value;
    if (!localStorage['weight-he'] && !localStorage['weight-atk'] && !localStorage['weight-hp']) {
        var option = void 0;
        $$('#preset > *').forEach(function (option) {
            option.selected = +option.innerHTML.replace('z', '') < game.global.highestLevelCleared;
        });
        select_preset($('#preset').value);
    }
    // He / unlocks
    var helium = game.global.heliumLeftover;
    for (var perk in game.portal)
        helium += game.portal[perk].heliumSpent;
    var unlocks = Object.keys(game.portal).filter(function (perk) { return !game.portal[perk].locked; });
    if (!game.global.canRespecPerks)
        unlocks = unlocks.map(function (perk) { return perk + '>' + game.portal[perk].level; });
    // Income
    var tt = game.talents.turkimp4 ? 1 :
        game.talents.turkimp3 ? 0.6 :
            game.talents.turkimp2 ? 0.4 :
                game.talents.turkimp ? 0.3 : 0.25;
    var prod = 1 + tt;
    var loot = 1 + 0.333 * tt;
    var chronojest = 27 * game.unlocks.imps.Jestimp + 15 * game.unlocks.imps.Chronoimp;
    var cache = zone < 60 ? 0 : zone < 85 ? 7 : zone < 160 ? 10 : zone < 185 ? 14 : 20;
    chronojest += (game.talents.mapLoot2 ? 5 : 4) * cache;
    for (var _i = 0, _a = (game.global.StaffEquipped.mods || []); _i < _a.length; _i++) {
        var mod = _a[_i];
        if (mod[0] === 'MinerSpeed')
            prod *= 1 + 0.01 * mod[1];
        else if (mod[0] === 'metalDrop')
            loot *= 1 + 0.01 * mod[1];
    }
    // Fill the fields
    update_dg();
    $('#helium').value = helium + ($('#respec').checked ? 0 : game.resources.helium.owned);
    $('#unlocks').value = unlocks.join(',');
    $('#whipimp').checked = game.unlocks.imps.Whipimp;
    $('#magnimp').checked = game.unlocks.imps.Magnimp;
    $('#tauntimp').checked = game.unlocks.imps.Tauntimp;
    $('#venimp').checked = game.unlocks.imps.Venimp;
    $('#chronojest').value = chronojest;
    $('#prod').value = ($('#prod').value.startsWith('0*') ? '0*' : '') + prettify(prod);
    $('#loot').value = ($('#loot').value.startsWith('0*') ? '0*' : '') + prettify(loot);
    $('#breed-timer').value = game.talents.patience ? 45 : 30;
}
var parse_inputs = function (preset) { return ({
    he_left: preset == 'nerfed' ? 1e8 : input('helium'),
    zone: preset == 'nerfed' ? 200 : parseInt($('#zone').value),
    perks: parse_perks($('#fixed').value, $('#unlocks').value),
    weight: {
        helium: input('weight-he'),
        attack: input('weight-atk'),
        health: input('weight-hp'),
        trimps: preset == 'carp' ? 1e6 : 0,
    },
    mod: {
        storage: 0.125,
        dg: input('dg'),
        soldiers: preset == 'trapper' ? game.resources.trimps.owned : preset == 'trimp',
        tent_city: preset == 'tent',
        whip: $('#whipimp').checked,
        magn: $('#magnimp').checked,
        taunt: $('#tauntimp').checked,
        ven: $('#venimp').checked,
        chronojest: input('chronojest'),
        prod: input('prod'),
        loot: input('loot'),
        breed_timer: input('breed-timer'),
    }
}); };
function display(results) {
    var he_left = results[0], perks = results[1];
    $('#results').style.opacity = 1;
    $('#info').innerText = localStorage.more ? 'Less info' : 'More info';
    $('#he-left').innerHTML = prettify(he_left) + ' Helium Left Over';
    $('#perks').innerHTML = perks.filter(function (p) { return !p.locked; }).map(function (perk) {
        var name = perk.name, level = perk.level, cap = perk.cap, spent = perk.spent;
        var diff = game ? level - game.portal[perk.name].level : 0;
        var diff_text = diff ? " (" + (diff > 0 ? '+' : '-') + prettify(abs(diff)) + ")" : '';
        var style = diff > 0 ? 'adding' : diff < 0 ? 'remove' : level >= cap ? 'capped' : '';
        return "<div class='perk " + style + " " + localStorage.more + "'>"
            + ("<b>" + name.replace('_', ' ') + "</b><br>")
            + ("Level: <b>" + prettify(level) + diff_text + "</b><br><span class=more>")
            + ("Price: " + (level >= cap ? '∞' : prettify(perk.cost())) + "<br>")
            + ("Spent: " + prettify(spent) + "</span></div>");
    }).join('');
}
function main() {
    var preset = $('#preset').value;
    if (preset == 'trapper' && (!game || game.global.challengeActive != 'Trapper')) {
        show_alert('ko', 'This preset requires a save currently running Trapper². Start a new run using “Trapper² (initial)”, export, and try again.');
        return;
    }
    var inputs = parse_inputs(preset);
    var max_zone = game ? game.global.highestLevelCleared : 999;
    if ((preset.match(/trimp|coord/) && inputs.zone >= max_zone / 2)
        || (preset === 'trapper' && inputs.zone >= max_zone - 40))
        show_alert('warning', 'Your target zone seems too high for this c², try lowering it.');
    if (preset == 'spire' && game && game.global.world != 100 * (2 + game.global.lastSpireCleared))
        show_alert('warning', 'This preset is meant to be used mid-run, when you’re done farming for the Spire.');
    display(optimize(inputs));
}
function toggle_info() {
    localStorage.more = localStorage.more ? '' : 'more';
    $$('.perk').forEach(function (elem) { return elem.classList.toggle('more'); });
    $('#info').innerText = localStorage.more ? 'Less info' : 'More info';
}
// Total bonus from an additive perk. `x` is the percentage from each level.
var add = function (perk, x) { return 1 + perk.level * x / 100; };
// Total bonus from a compounding perk. `x` is the percentage from each level.
var mult = function (perk, x) { return pow(1 + x / 100, perk.level); };
function parse_perks(fixed, unlocks) {
    var perks = [
        new Perk('Looting_II', 100e3, 10e3, Infinity, 1e4),
        new Perk('Carpentry_II', 100e3, 10e3, Infinity, 1e4),
        new Perk('Motivation_II', 50e3, 1e3, Infinity, 1e4),
        new Perk('Power_II', 20e3, 500, Infinity, 1e4),
        new Perk('Toughness_II', 20e3, 500, Infinity, 1e4),
        new Perk('Overkill', 1e6, 0, 30, 1e4),
        new Perk('Resourceful', 50e3, 0, Infinity, 1e6),
        new Perk('Coordinated', 150e3, 0, Infinity, 1e4),
        new Perk('Siphonology', 100e3, 0, 3, 1e4),
        new Perk('Anticipation', 1000, 0, 10, 1e4),
        new Perk('Resilience', 100, 0, Infinity, 1e4),
        new Perk('Meditation', 75, 0, 7, 1e4),
        new Perk('Relentlessness', 75, 0, 10, 1e4),
        new Perk('Carpentry', 25, 0, Infinity, 1e4),
        new Perk('Artisanistry', 15, 0, Infinity, 1e4),
        new Perk('Range', 1, 0, 10, 1e4),
        new Perk('Agility', 4, 0, 20, 1e4),
        new Perk('Bait', 4, 0, Infinity, 1e7),
        new Perk('Trumps', 3, 0, Infinity, 1e8),
        new Perk('Pheromones', 3, 0, Infinity, 1e6),
        new Perk('Packrat', 3, 0, Infinity, 1e7),
        new Perk('Motivation', 2, 0, Infinity, 1e4),
        new Perk('Power', 1, 0, Infinity, 1e4),
        new Perk('Toughness', 1, 0, Infinity, 1e4),
        new Perk('Looting', 1, 0, Infinity, 1e4),
    ];
    if (!unlocks.match(/>/))
        unlocks = unlocks.replace(/(?=,|$)/g, '>0');
    var _loop_1 = function (item) {
        var m = item.match(/(\S+) *([<=>])=?(.*)/);
        if (!m)
            throw 'Enter a list of perk levels, such as “power=42, toughness=51”';
        var tier2 = m[1].match(/2$|II$/);
        var name_1 = m[1].replace(/[ _]?(2|II)/i, '').replace(/^OK/i, 'O').replace(/^Looty/i, 'L');
        var regex = new RegExp("^" + name_1 + "[a-z]*" + (tier2 ? '_II' : '') + "$", 'i');
        var matches = perks.filter(function (p) { return p.name.match(regex); });
        if (matches.length > 1)
            throw "Ambiguous perk abbreviation: " + m[1] + ".";
        if (matches.length < 1)
            throw "Unknown perk: " + m[1] + ".";
        var level = parse_suffixes(m[3]);
        if (!isFinite(level))
            throw "Invalid number: " + m[3] + ".";
        matches[0].locked = false;
        if (m[2] != '>')
            matches[0].cap = level;
        if (m[2] != '<')
            matches[0].must = level;
    };
    for (var _i = 0, _a = (unlocks + ',' + fixed).split(/,/).filter(function (x) { return x; }); _i < _a.length; _i++) {
        var item = _a[_i];
        _loop_1(item);
    }
    return perks;
}
function optimize(params) {
    var he_left = params.he_left, zone = params.zone, perks = params.perks, weight = params.weight, mod = params.mod;
    var Looting_II = perks[0], Carpentry_II = perks[1], Motivation_II = perks[2], Power_II = perks[3], Toughness_II = perks[4], Overkill = perks[5], Resourceful = perks[6], Coordinated = perks[7], Siphonology = perks[8], Anticipation = perks[9], Resilience = perks[10], Meditation = perks[11], Relentlessness = perks[12], Carpentry = perks[13], Artisanistry = perks[14], Range = perks[15], Agility = perks[16], Bait = perks[17], Trumps = perks[18], Pheromones = perks[19], Packrat = perks[20], Motivation = perks[21], Power = perks[22], Toughness = perks[23], Looting = perks[24];
    for (var _i = 0, perks_1 = perks; _i < perks_1.length; _i++) {
        var perk = perks_1[_i];
        if (perk.name.endsWith('_II'))
            perk.pack = pow(10, max(0, floor(log(he_left) / log(100) - 4.2)));
    }
    for (var _a = 0, _b = ['whip', 'magn', 'taunt', 'ven']; _a < _b.length; _a++) {
        var name_2 = _b[_a];
        mod[name_2] = pow(1.003, zone * 99 * 0.03 * mod[name_2]);
    }
    var books = pow(1.25, zone) * pow(zone > 100 ? 1.28 : 1.2, max(zone - 59, 0));
    var gigas = max(0, min(zone - 60, zone / 2 - 25, zone / 3 - 12, zone / 5, zone / 10 + 17, 39));
    var base_housing = pow(1.25, min(zone / 2, 30) + gigas);
    var mystic = zone >= 25 ? floor(min(zone / 5, 9 + zone / 25, 15)) : 0;
    var tacular = (20 + zone - zone % 5) / 100;
    var base_income = 600 * mod.whip * books;
    var base_helium = pow(zone - 19, 2);
    var max_tiers = zone / 5 + +((zone - 1) % 10 < 5);
    var exp = {
        cost: pow(1.069, 0.85 * (zone < 60 ? 57 : 53)),
        attack: pow(1.19, 13),
        health: pow(1.19, 14),
        block: pow(1.19, 10),
    };
    var equip_cost = {
        attack: 211 * (weight.attack + weight.health) / weight.attack,
        health: 248 * (weight.attack + weight.health) / weight.health,
        block: 5 * (weight.attack + weight.health) / weight.health,
    };
    // Number of ticks it takes to one-shot an enemy.
    function ticks() {
        return 1 + +(Agility.level < 3) + ceil(10 * mult(Agility, -5));
    }
    var moti = function () { return add(Motivation, 5) * add(Motivation_II, 1); };
    var looting = function () { return add(Looting, 5) * add(Looting_II, 0.25); };
    function income(ignore_prod) {
        var storage = mod.storage * mult(Resourceful, -5) / add(Packrat, 20);
        var loot = looting() * mod.magn / ticks();
        var prod = ignore_prod ? 0 : moti() * add(Meditation, 1) * mod.prod;
        var chronojest = mod.chronojest * 0.1 * prod * loot;
        return base_income * (prod + loot * mod.loot + chronojest) * (1 - storage);
    }
    // Max population
    var trimps = mod.tent_city ? function () {
        var carp = mult(Carpentry, 10) * add(Carpentry_II, 0.25);
        var territory = add(Trumps, 20);
        return 10 * (mod.taunt + territory * (mod.taunt - 1) * 111) * carp;
    } : function () {
        var carp = mult(Carpentry, 10) * add(Carpentry_II, 0.25);
        var bonus = 3 + max(log(income() / base_income * carp / mult(Resourceful, -5)), 0);
        var territory = add(Trumps, 20) * zone;
        return 10 * (base_housing * bonus + territory) * carp * mod.taunt + mod.dg * carp;
    };
    function equip(stat) {
        var cost = equip_cost[stat] * mult(Artisanistry, -5);
        var levels = 1.136;
        var tiers = log(1 + income() * trimps() / cost) / log(exp.cost);
        if (tiers > max_tiers + 0.45) {
            levels = log(1 + pow(exp.cost, tiers - max_tiers) * 0.2) / log(1.2);
            tiers = max_tiers;
        }
        return levels * pow(exp[stat], tiers);
    }
    // Number of buildings of a given kind that can be built with the current income.
    // cost: base cost of the buildings
    // exp: cost increase for each new level of the building
    function building(cost, exp) {
        cost *= 4 * mult(Resourceful, -5);
        return log(1 + income(true) * trimps() * (exp - 1) / cost) / log(exp);
    }
    // Number of zones spent in the Magma
    function magma() {
        return max(zone - 229, 0);
    }
    // function mancers() {
    // let tributes = building(10000, 1.05);
    // let mancers = log(loot * pow(1.05, tributes) / 1e62) / log(1.01);
    // return magma() ? 1 + 0.6 * (1 - pow(0.9999, mancers)) : 1;
    // }
    // Breed speed
    function breed() {
        var nurseries = building(2e6, 1.06) / (1 + 0.1 * min(magma(), 20));
        var potency = 0.0085 * (zone >= 60 ? 0.1 : 1) * pow(1.1, floor(zone / 5));
        return potency * pow(1.01, nurseries) * add(Pheromones, 10) * mod.ven;
    }
    var group_size = [];
    for (var coord = 0; coord <= log(1 + he_left / 500e3) / log(1.3); ++coord) {
        var ratio = 1 + 0.25 * pow(0.98, coord);
        var result = 1;
        for (var i = 0; i < 100; ++i)
            result = ceil(result * ratio);
        group_size[coord] = result / pow(ratio, 100);
    }
    // Theoretical fighting group size (actual size is lower because of Coordinated)
    function soldiers() {
        var ratio = 1 + 0.25 * mult(Coordinated, -2);
        var pop = (mod.soldiers || trimps()) / 3;
        if (mod.soldiers > 1)
            pop += 36000 * add(Bait, 100);
        var coords = log(pop / group_size[Coordinated.level]) / log(ratio);
        var available = zone - 1 + (magma() ? 100 : 0);
        return group_size[0] * pow(1.25, min(coords, available));
    }
    // Total attack
    function attack() {
        var attack = (0.15 + equip('attack')) * pow(0.8, magma());
        attack *= add(Power, 5) * add(Power_II, 1);
        attack *= add(Relentlessness, 5 * add(Relentlessness, 30));
        attack *= pow(1 + Siphonology.level, 0.1) * add(Range, 1);
        attack *= add(Anticipation, 6);
        return soldiers() * attack;
    }
    // Total survivability (accounts for health and block)
    function health() {
        var health = (0.6 + equip('health')) * pow(0.8, magma());
        health *= add(Toughness, 5) * add(Toughness_II, 1) * mult(Resilience, 10);
        // block
        var gyms = building(400, 1.185);
        var trainers = (gyms * log(1.185) - log(1 + gyms)) / log(1.1) + 25 - mystic;
        var block = 0.04 * gyms * pow(1 + mystic / 100, gyms) * (1 + tacular * trainers);
        // target number of attacks to survive
        var attacks = 60;
        if (zone < 70) {
            // number of ticks needed to repopulate an army
            var timer = log(1 + soldiers() * breed() / add(Bait, 100)) / log(1 + breed());
            attacks = timer / ticks();
        }
        else {
            var ratio = 1 + 0.25 * mult(Coordinated, -2);
            var available = zone - 1 + (magma() ? 100 : 0);
            var required = group_size[Coordinated.level] * pow(ratio, available);
            var fighting = min(required / trimps(), 1 / 3);
            var target_speed = fighting > 1e-9 ?
                (pow(0.5 / (0.5 - fighting), 0.1 / mod.breed_timer) - 1) * 10 :
                fighting / mod.breed_timer;
            var geneticists = log(breed() / target_speed) / -log(0.98);
            health *= pow(1.01, geneticists);
        }
        health /= attacks;
        if (zone < 60)
            block += equip('block');
        else
            block = min(block, 4 * health);
        return soldiers() * (block + health);
    }
    var agility = function () { return 1 / mult(Agility, -5); };
    var helium = function () { return base_helium * looting() + 45; };
    var overkill = function () { return add(Overkill, 100); };
    var stats = { agility: agility, helium: helium, attack: attack, health: health, overkill: overkill, trimps: trimps };
    function score() {
        var result = 0;
        for (var i in weight) {
            if (!weight[i])
                continue;
            var stat = stats[i]();
            if (!isFinite(stat))
                throw Error(i + ' is ' + stat);
            result += weight[i] * log(stat);
        }
        return result;
    }
    function best_perk() {
        for (var _i = 0, perks_2 = perks; _i < perks_2.length; _i++) {
            var perk = perks_2[_i];
            if (perk.level < perk.must)
                return perk;
        }
        var best;
        var max = 0;
        var baseline = score();
        for (var _a = 0, perks_3 = perks; _a < perks_3.length; _a++) {
            var perk = perks_3[_a];
            if (perk.locked || perk.level >= perk.cap || perk.cost() > he_left)
                continue;
            perk.level += perk.pack;
            var gain = score() - baseline;
            perk.level -= perk.pack;
            var efficiency = gain / perk.cost();
            if (efficiency > max) {
                max = efficiency;
                best = perk;
            }
        }
        return best;
    }
    mod.loot *= 20.8 * (0.7 + 0.3 * floor((zone + 1) / 101));
    weight.agility = (weight.helium + weight.attack) / 2;
    weight.overkill = 0.25 * weight.attack * (2 - pow(0.9, weight.helium / weight.attack));
    // Main loop
    for (var best = void 0; (best = best_perk());) {
        var spent = 0;
        while (best.level < best.cap && (best.level < best.must || spent < he_left / best.free)) {
            he_left -= best.cost();
            spent += best.cost();
            best.level += best.pack;
            if (best.level == 1000 * best.pack)
                best.pack *= 10;
        }
        best.spent += spent;
    }
    for (var _c = 0, perks_4 = perks; _c < perks_4.length; _c++) {
        var perk = perks_4[_c];
        console.log(perk.name, '=', perk.level);
    }
    return [he_left, perks];
}
