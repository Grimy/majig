/// <reference path="./trimps.ts"/>

function read_save() {
	let imps = 0;
	for (let imp of ['Chronoimp', 'Jestimp', 'Titimp', 'Flutimp', 'Goblimp'])
		imps += game.unlocks.imps[imp];
	let crits = game.portal.Relentlessness.level;
	let challenge = game.global.challengeActive;
	let attack = game.global.soldierCurrentAttack;
	let minFluct = 0.8 + 0.02 * game.portal.Range.level;
	let maxFluct = 1.2;
	let enemyHealth = 1;
	let zone = game.global.world;
	let perfect = game.global.highestLevelCleared >= 109;
	let nature = game.empowerments[['Poison', 'Wind', 'Ice'][ceil(zone / 5) % 3]];
	let diplomacy = game.talents.nature3 ? 5 : 0;
	let speed = 10 * pow(0.95, game.portal.Agility.level) - game.talents.hyperspeed;

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
		let time = (new Date().getTime() - game.global.zoneStarted) / 60000;
		let bonus = pow(1.2, min(12, floor((time + 5) / 10))) - 1;
		attack *= 1 + 3 * (1 - pow(0.9999, game.jobs.Magmamancer.owned)) * bonus;
	}

	if (game.talents.healthStrength) {
		let effective_zone = min(zone, game.global.lastSpireCleared * 100 + 199);
		let cells = effective_zone < 300 ? 0 : floor((effective_zone - 270) / 15);
		attack *= 1 + 0.15 * cells;
	}

	if (challenge === "Discipline") {
		minFluct = 0.005;
		maxFluct = 1.995;
	} else if (challenge === "Balance" || challenge === "Meditate" || challenge === "Toxicity") {
		enemyHealth *= 2;
	} else if (challenge === "Daily") {
		let daily = (mod: string) => game.global.dailyChallenge[mod] ? game.global.dailyChallenge[mod].strength : 0;
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
	} else if (challenge === "Life") {
		enemyHealth *= 11;
		attack *= 1 + 0.1 * game.challenges.Life.stacks;
	} else if (challenge === "Lead") {
		if (zone % 2 == 1)
			attack *= 1.5;
		else
			show_alert('warning', 'Are you <b>sure</b> you want to farm on an even Lead zone?');
		enemyHealth *= 1 + 0.04 * game.challenges.Lead.stacks;
	} else if (challenge === "Obliterated") {
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

const parse_inputs = () => ({
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
	poison: 0, wind: 0, ice: 0,
	[['poison', 'wind', 'ice'][ceil(input('zone') / 5) % 3]]: $('#nature').value / 100,
});

// Return info about the best zone for each stance
function get_best(stats: any[], stances: string) {
	let best: any = { overall: "", stance: "", second: "", second_stance: "", ratio: 0 };

	/* jshint loopfunc:true */
	for (let stance of stances) {
		stats.sort((a, b) => b[stance].value - a[stance].value);
		best[stance] = stats[0].zone;
	}

	stats.sort((a, b) => b.value - a.value);
	best.overall = stats[0].zone;
	best.stance = stats[0].stance;
	if (stats[1]) {
		best.second = stats[1].zone;
		best.second_stance = stats[1].stance;
		best.ratio = stats[0].value / stats[1].value;
	}

	return best;
}

function display(results: any[]) {
	let [stats, stances] = results;

	if (stats.length === 0)
		throw 'Your attack is too low to farm anywhere.';

	let best = get_best(stats.slice(), stances);
	let show_stance = $('#zone').value >= 60;
	let html = '';

	if (stances.length > 1)
		html += `<tr><th colspan=2>${stances.replace(/(?!$)/g, '<th colspan=2>')}</tr>`;
	html += '<tr><th>Level<th>Base loot';
	for (let _ of stances)
		html += '<th>Cells/s<th>Total';

	for (let zone_stats of stats) {
		let zone = zone_stats.zone;
		html += '</tr><tr><td class=align-right>';

		for (let stance of stances)
			if (zone === best[stance] && show_stance)
				html += `<b>${stance}</b> `;

		html += zone === best.overall ? `<b>${zone}</b>` : zone;
		html += '<td>' + prettify(zone_stats.loot) + '%';

		for (let stance of stances) {
			let value = prettify(zone_stats[stance].value);
			html += '<td>' + zone_stats[stance].speed.toFixed(3) + '<td>';
			html += zone === best[stance] ? `<b>${value}</b>` : value;
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
		} else {
			$('#result').textContent = 'You should really be pushing rather than farming';
			$('#comment').textContent = '';
		}
		return;
	}

	let percentage = (best.ratio - 1) * 100;
	let adverb = ["", " probably", "", " really", " definitely"][min(floor(percentage / 2), 4)];

	$('#result').textContent = `You should ${adverb} farm on ${best.overall}`;
	if (percentage < 2)
		$('#result').textContent += ` or ${best.second}`;

	$('#comment').textContent = percentage < 2 ? `They’re equally efficient.` :
		percentage < 4 ? `But ${best.second} is almost as good.` :
		`It’s ${percentage.toFixed(1)}% more efficient than ${best.second}.`;
}

function main() {
	display(stats(parse_inputs()));
}

///
// Start back-end stuff
///

const max_ticks = 864000; // One day

let test: number[] = [1, 2];

const biomes: {[key: string]: number[]} = {
	all: [0.7, 1.3, 1.3, 1, 0.7, 0.8, 1.1],
	gardens: [0.95, 0.95, 1, 0.8, 1.3, 1.1, 1.4],
	sea: [0.9, 1.1, 1.1],
	mountain: [2, 1.4, 1.4],
	forest: [1.2, 1.5],
	depths: [1, 0.7, 1.4, 0.8],
};

let seed = 42;
const max_rand = pow(2, 31);
function rng() {
	seed ^= seed >> 11;
	seed ^= seed << 8;
	seed ^= seed >> 19;
	return seed;
}

// Base HP (before imp modifiers) for an enemy at the given position (zone + cell).
function enemy_hp(g: any, zone: number, cell: number) {
	let amt = 14.3 * sqrt(zone * pow(3.265, zone)) - 12.1;
	amt *= zone < 60 ? (3 + (3 / 110) * cell) : (5 + 0.08 * cell) * pow(1.1, zone - 59);
	if (g.zone >= 230)
		amt *= round(50 * pow(1.05, floor(g.zone / 6 - 25))) / 10;
	return g.difficulty * g.challenge * amt;
}

// Simulate farming at the given zone for a fixed time, and return the number cells cleared.
function simulate(g: any, zone: number) {
	let titimp = 0;
	let ok_dmg = 0;
	let cell = 0;
	let loot = 0;
	let poison = 0, wind = 0, ice = 0;

	for (let ticks = 0; ticks < max_ticks; ++cell) {

		let imp, toughness;
		if (cell % g.size === 99) {
			imp = max_rand;
			toughness = 2.9;
		} else {
			imp = rng();
			toughness = imp < g.import_chance ? 1 : g.biome[imp % g.biome.length];
		}

		let hp = toughness * enemy_hp(g, zone, cell % g.size);
		if (cell % g.size !== 0)
			hp -= min(ok_dmg, hp);

		let turns = 0;
		while (hp > 0) {
			++turns;
			let damage = g.atk * (1 + g.range * rng());
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
function zone_stats(zone: number, stances: string, g: any) {
	let result: any = {
		zone: 'z' + zone,
		value: 0,
		stance: '',
		loot: 100 * (zone < g.zone ? pow(0.8, g.zone - g.reducer - zone) : pow(1.1, zone - g.zone)),
	};

	for (let stance of stances) {
		g.atk = g.attack * (stance == 'D' ? 4 : stance == 'X' ? 1 : 0.5);
		let speed = simulate(g, zone);
		let value = speed * result.loot * (stance == 'S' ? 2 : 1);
		result[stance] = { speed, value };

		if (value > result.value) {
			result.value = value;
			result.stance = stance;
		}
	}

	return result;
}

function map_cost(mods: number, level: number) {
	mods += level;
	return mods * pow(1.14, mods) * level * pow(1.03 + level / 50000, level) / 42.75;
}

// Return a list of efficiency stats for all sensible zones
function stats(g: any) {
	let stats = [];
	let stances = (g.zone < 70 ? 'X' : 'D') + (g.scry && g.zone >= 60 ? 'S' : '');

	let extra = 0;
	while (extra < 10 && g.fragments > map_cost(53.98 + 10 * extra, g.zone))
		++extra;
	extra = extra || -g.reducer;

	for (let zone = 1; zone <= g.zone + extra; ++zone) {
		let ratio = g.attack / (max.apply(0, g.biome) * enemy_hp(g, zone, g.size - 1));
		if (ratio < 0.001)
			break;
		if (zone >= 6 && (ratio < 2 || zone == g.zone + extra))
			stats.push(zone_stats(zone, stances, g));
		if (g.coordinate)
			g.challenge = ceil(1.25 * g.challenge);
	}

	return [stats, stances];
}
