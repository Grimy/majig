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
function read_save() {
    var imps = 0;
    for (var _i = 0, _a = ['Chronoimp', 'Jestimp', 'Titimp', 'Flutimp', 'Goblimp']; _i < _a.length; _i++) {
        var imp = _a[_i];
        imps += game.unlocks.imps[imp];
    }
    var crits = game.portal.Relentlessness.level;
    var challenge = game.global.challengeActive;
    var attack = game.global.soldierCurrentAttack;
    var minFluct = 0.8 + 0.02 * game.portal.Range.level;
    var maxFluct = 1.2;
    var enemyHealth = 1;
    var zone = game.global.world;
    var perfect = game.global.highestLevelCleared >= 109;
    var nature = game.empowerments[['Poison', 'Wind', 'Ice'][ceil(zone / 5) % 3]];
    var diplomacy = game.talents.nature3 ? 5 : 0;
    var speed = 10 * pow(0.95, game.portal.Agility.level) - game.talents.hyperspeed;
    if (game.talents.hyperspeed2 && zone <= ceil(game.global.highestLevelCleared / 2))
        --speed;
    attack *= 1 + 0.02 * game.global.antiStacks * game.portal.Anticipation.level;
    attack *= 1 + 0.01 * game.global.achievementBonus;
    attack *= 1 + 0.2 * game.global.roboTrimpLevel;
    attack *= 1 + game.goldenUpgrades.Battle.currentBonus;
    attack *= 1 + 0.01 * game.global.totalSquaredReward;
    attack /= [1, 0.5, 4, 0.5, 0.5][game.global.formation];
    if (game.global.sugarRush > 0)
        attack *= floor(zone / 100);
    if (game.talents.stillRowing2)
        attack *= 1 + 0.06 * game.global.spireRows;
    if (game.talents.magmamancer) {
        var time = (new Date().getTime() - game.global.zoneStarted) / 60000;
        var bonus = pow(1.2, min(12, floor((time + 5) / 10))) - 1;
        attack *= 1 + 3 * (1 - pow(0.9999, game.jobs.Magmamancer.owned)) * bonus;
    }
    if (game.talents.healthStrength) {
        var effective_zone = min(zone, game.global.lastSpireCleared * 100 + 199);
        var cells = effective_zone < 300 ? 0 : floor((effective_zone - 270) / 15);
        attack *= 1 + 0.15 * cells;
    }
    if (challenge === "Discipline") {
        minFluct = 0.005;
        maxFluct = 1.995;
    }
    else if (challenge === "Balance" || challenge === "Meditate" || challenge === "Toxicity") {
        enemyHealth *= 2;
    }
    else if (challenge === "Daily") {
        var daily = function (mod) { return game.global.dailyChallenge[mod] ? game.global.dailyChallenge[mod].strength : 0; };
        enemyHealth *= 1 + 0.2 * daily('badHealth');
        enemyHealth *= 1 + 0.3 * daily('badMapHealth');
        minFluct -= daily('minDamage') ? 0.09 + 0.01 * daily('minDamage') : 0;
        maxFluct += daily('maxDamage');
        attack *= 1 - 0.09 * daily('weakness');
        attack *= 1 + 0.1 * ceil(daily('rampage') / 10) * (1 + daily('rampage') % 10);
        if (zone % 2 == 1)
            attack *= 1 - 0.02 * daily('oddTrimpNerf');
        else
            attack *= 1 + 0.2 * daily('evenTrimpBuff');
    }
    else if (challenge === "Life") {
        enemyHealth *= 11;
        attack *= 1 + 0.1 * game.challenges.Life.stacks;
    }
    else if (challenge === "Lead") {
        if (zone % 2 == 1)
            attack *= 1.5;
        else
            show_alert('warning', 'Are you <b>sure</b> you want to farm on an even Lead zone?');
        enemyHealth *= 1 + 0.04 * game.challenges.Lead.stacks;
    }
    else if (challenge === "Obliterated") {
        enemyHealth *= pow(10, 12 + floor(zone / 10));
    }
    $('#attack').value = prettify(attack * minFluct);
    $('#cc').value = 5 * crits + game.heirlooms.Shield.critChance.currentBonus;
    $('#cd').value = 100 + 30 * crits + game.heirlooms.Shield.critDamage.currentBonus;
    $('#challenge').value = prettify(enemyHealth);
    $('#coordinate').checked = challenge === "Coordinate";
    $('#difficulty').value = perfect ? 75 : 80;
    $('#fragments').value = prettify(game.resources.fragments.owned);
    $('#imports').value = imps;
    $('#nature').value = zone >= 236 ? nature.level + diplomacy : 0;
    $('#overkill').value = game.portal.Overkill.level;
    $('#range').value = +(maxFluct / minFluct).toPrecision(5);
    $('#reducer').checked = game.talents.mapLoot;
    $('#scry').checked = game.global.highestLevelCleared >= 180;
    $('#size').value = game.talents.mapLoot2 ? 20 : perfect ? 25 : 27;
    $('#speed').value = prettify(speed);
    $('#titimp').checked = game.unlocks.imps.Titimp;
    $('#transfer').value = zone >= 236 ? nature.retainLevel + diplomacy : 0;
    $('#zone').value = zone;
}
var parse_inputs = function () {
    return (_a = {
            attack: input('attack'),
            biome: biomes.all.concat(biomes[$('#biome').value]),
            cc: $('#cc').value / 100 * max_rand,
            cd: 1 + $('#cd').value / 100,
            challenge: input('challenge'),
            coordinate: $('#coordinate').checked,
            difficulty: $('#difficulty').value / 100,
            fragments: input('fragments'),
            import_chance: $('#imports').value * 0.03 * max_rand,
            overkill: $('#overkill').value * 0.005,
            range: ($('#range').value - 1) / max_rand,
            reducer: $('#reducer').checked,
            scry: $('#scry').checked,
            size: $('#size').value | 0,
            speed: input('speed'),
            titimp: $('#titimp').checked,
            transfer: $('#transfer').value / 100,
            zone: $('#zone').value | 0,
            poison: 0, wind: 0, ice: 0
        },
        _a[['poison', 'wind', 'ice'][ceil(input('zone') / 5) % 3]] = $('#nature').value / 100,
        _a);
    var _a;
};
// Return info about the best zone for each stance
function get_best(stats, stances) {
    var best = { overall: "", stance: "", second: "", second_stance: "", ratio: 0 };
    var _loop_1 = function (stance) {
        stats.sort(function (a, b) { return b[stance].value - a[stance].value; });
        best[stance] = stats[0].zone;
    };
    /* jshint loopfunc:true */
    for (var _i = 0, stances_1 = stances; _i < stances_1.length; _i++) {
        var stance = stances_1[_i];
        _loop_1(stance);
    }
    stats.sort(function (a, b) { return b.value - a.value; });
    best.overall = stats[0].zone;
    best.stance = stats[0].stance;
    if (stats[1]) {
        best.second = stats[1].zone;
        best.second_stance = stats[1].stance;
        best.ratio = stats[0].value / stats[1].value;
    }
    return best;
}
function display(results) {
    var stats = results[0], stances = results[1];
    if (stats.length === 0) {
        show_alert('ko', 'Your attack is too low to farm anywhere.');
        return;
    }
    var best = get_best(stats.slice(), stances);
    var show_stance = $('#zone').value >= 60;
    var html = '';
    if (stances.length > 1)
        html += "<tr><th colspan=2>" + stances.replace(/(?!$)/g, '<th colspan=2>') + "</tr>";
    html += '<tr><th>Level<th>Base loot';
    for (var _i = 0, stances_2 = stances; _i < stances_2.length; _i++) {
        var stance = stances_2[_i];
        html += '<th>Cells/s<th>Total';
    }
    for (var _a = 0, stats_1 = stats; _a < stats_1.length; _a++) {
        var zone_stats_1 = stats_1[_a];
        var zone = zone_stats_1.zone;
        html += '</tr><tr><td class=align-right>';
        for (var _b = 0, stances_3 = stances; _b < stances_3.length; _b++) {
            var stance = stances_3[_b];
            if (zone === best[stance] && show_stance)
                html += "<b>" + stance + "</b> ";
        }
        html += zone === best.overall ? "<b>" + zone + "</b>" : zone;
        html += '<td>' + prettify(zone_stats_1.loot) + '%';
        for (var _c = 0, stances_4 = stances; _c < stances_4.length; _c++) {
            var stance = stances_4[_c];
            var value = prettify(zone_stats_1[stance].value);
            html += '<td>' + zone_stats_1[stance].speed.toFixed(3) + '<td>';
            html += zone === best[stance] ? "<b>" + value + "</b>" : value;
        }
    }
    $('#details').innerHTML = html + '</tr>';
    $('#results').style.opacity = 1;
    if (show_stance) {
        best.overall += ' in ' + best.stance;
        best.second += ' in ' + best.second_stance;
    }
    if (stats.length == 1) {
        if ($('#zone').value % 100 === 0 && $('#zone').value > 100) {
            $('#result').textContent = 'You should definitely farm on ' + best.overall;
            $('#comment').textContent = 'Good luck with the Spire!';
        }
        else {
            $('#result').textContent = 'You should really be pushing rather than farming';
            $('#comment').textContent = '';
        }
        return;
    }
    var percentage = (best.ratio - 1) * 100;
    var adverb = ["", " probably", "", " really", " definitely"][min(floor(percentage / 2), 4)];
    $('#result').textContent = "You should " + adverb + " farm on " + best.overall;
    if (percentage < 2)
        $('#result').textContent += " or " + best.second;
    $('#comment').textContent = percentage < 2 ? "They\u2019re equally efficient." :
        percentage < 4 ? "But " + best.second + " is almost as good." :
            "It\u2019s " + percentage.toFixed(1) + "% more efficient than " + best.second + ".";
}
function main() {
    display(stats(parse_inputs()));
}
///
// Start back-end stuff
///
var max_ticks = 864000; // One day
var test = [1, 2];
var biomes = {
    all: [0.7, 1.3, 1.3, 1, 0.7, 0.8, 1.1],
    gardens: [0.95, 0.95, 1, 0.8, 1.3, 1.1, 1.4],
    sea: [0.9, 1.1, 1.1],
    mountain: [2, 1.4, 1.4],
    forest: [1.2, 1.5],
    depths: [1, 0.7, 1.4, 0.8],
};
var seed = 42;
var max_rand = pow(2, 31);
function rng() {
    seed ^= seed >> 11;
    seed ^= seed << 8;
    seed ^= seed >> 19;
    return seed;
}
// Base HP (before imp modifiers) for an enemy at the given position (zone + cell).
function enemy_hp(g, zone, cell) {
    var amt = 14.3 * sqrt(zone * pow(3.265, zone)) - 12.1;
    amt *= zone < 60 ? (3 + (3 / 110) * cell) : (5 + 0.08 * cell) * pow(1.1, zone - 59);
    if (g.zone >= 230)
        amt *= round(50 * pow(1.05, floor(g.zone / 6 - 25))) / 10;
    return g.difficulty * g.challenge * amt;
}
// Simulate farming at the given zone for a fixed time, and return the number cells cleared.
function simulate(g, zone) {
    var titimp = 0;
    var ok_dmg = 0;
    var cell = 0;
    var loot = 0;
    var poison = 0, wind = 0, ice = 0;
    for (var ticks = 0; ticks < max_ticks; ++cell) {
        var imp = void 0, toughness = void 0;
        if (cell % g.size === 99) {
            imp = max_rand;
            toughness = 2.9;
        }
        else {
            imp = rng();
            toughness = imp < g.import_chance ? 1 : g.biome[imp % g.biome.length];
        }
        var hp = toughness * enemy_hp(g, zone, cell % g.size);
        if (cell % g.size !== 0)
            hp -= min(ok_dmg, hp);
        var turns = 0;
        while (hp > 0) {
            ++turns;
            var damage = g.atk * (1 + g.range * rng());
            damage *= rng() < g.cc ? g.cd : 1;
            damage *= titimp > ticks ? 2 : 1;
            damage *= 2 - pow(0.366, ice * g.ice);
            hp -= damage + poison * g.poison;
            poison += damage;
            ++ice;
        }
        wind = min(wind + turns, 200);
        loot += 1 + wind * g.wind;
        ok_dmg = -hp * g.overkill;
        ticks += +(turns > 0) + +(g.speed > 9) + ceil(turns * g.speed);
        if (g.titimp && imp < 0.03 * max_rand)
            titimp = min(max(ticks, titimp) + 300, ticks + 450);
        poison = ceil(g.transfer * poison) + 1;
        wind = ceil(g.transfer * wind) + 1;
        ice = ceil(g.transfer * ice) + 1;
    }
    return loot * 10 / max_ticks;
}
// Return efficiency stats for the given zone
function zone_stats(zone, stances, g) {
    var result = {
        zone: 'z' + zone,
        value: 0,
        stance: '',
        loot: 100 * (zone < g.zone ? pow(0.8, g.zone - g.reducer - zone) : pow(1.1, zone - g.zone)),
    };
    for (var _i = 0, stances_5 = stances; _i < stances_5.length; _i++) {
        var stance = stances_5[_i];
        g.atk = g.attack * (stance == 'D' ? 4 : stance == 'X' ? 1 : 0.5);
        var speed = simulate(g, zone);
        var value = speed * result.loot * (stance == 'S' ? 2 : 1);
        result[stance] = { speed: speed, value: value };
        if (value > result.value) {
            result.value = value;
            result.stance = stance;
        }
    }
    return result;
}
function map_cost(mods, level) {
    mods += level;
    return mods * pow(1.14, mods) * level * pow(1.03 + level / 50000, level) / 42.75;
}
// Return a list of efficiency stats for all sensible zones
function stats(g) {
    var stats = [];
    var stances = (g.zone < 70 ? 'X' : 'D') + (g.scry && g.zone >= 60 ? 'S' : '');
    var extra = 0;
    while (extra < 10 && g.fragments > map_cost(53.98 + 10 * extra, g.zone))
        ++extra;
    extra = extra || -g.reducer;
    for (var zone = 1; zone <= g.zone + extra; ++zone) {
        var ratio = g.attack / (max.apply(0, g.biome) * enemy_hp(g, zone, g.size - 1));
        if (ratio < 0.001)
            break;
        if (zone >= 6 && (ratio < 2 || zone == g.zone + extra))
            stats.push(zone_stats(zone, stances, g));
        if (g.coordinate)
            g.challenge = ceil(1.25 * g.challenge);
    }
    return [stats, stances];
}
