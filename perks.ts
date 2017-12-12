/// <reference path="./trimps.ts"/>

class Perk {
	locked = true;
	level = 0;
	pack = 1;
	must = 0;
	spent = 0;

	constructor(
		public name: string,
		private base_cost: number,
		private increment: number,
		public cap: number,
		public free: number
	) {}

	// Compute the current cost of a perk, based on its current level.
	cost() {
		return this.increment ? 
			this.pack * (this.base_cost + this.increment * (this.level + (this.pack - 1) / 2)) :
			ceil(this.level / 2 + this.base_cost * mult(this, 30));
	}
}

function validate_fixed() {
	try {
		parse_perks($('#fixed').value, 'l');
		$('#fixed').setCustomValidity('');
	} catch (err) {
		$('#fixed').setCustomValidity(err);
	}
}

document.addEventListener("DOMContentLoaded", validate_fixed, false);

let presets: {[key: string]: (string | number)[]} = {
	pick:       [ '', '', ''],
	early:      [  5,  4,  3],
	broken:     [  7,  3,  1],
	mid:        [ 16,  5,  1],
	corruption: [ 25,  7,  1],
	magma:      [ 35,  4,  3],
	z280:       [ 42,  6,  1],
	z400:       [ 88, 10,  1],
	z450:       [500, 50,  1],
	spire:      [  0,  1,  1],
	nerfed:     [  0,  4,  3],
	tent:       [  5,  4,  3],
	scientist:  [  0,  1,  3],
	carp:       [  0,  0,  0],
	trapper:    [  0,  7,  1],
	coord:      [  0, 40,  1],
	trimp:      [  0, 99,  1],
	metal:      [  0,  7,  1],
	c2:         [  0,  7,  1],
}

function select_preset(name: string) {
	let preset = presets[name];

	function special(regex: RegExp, field: HTMLInputElement, prefix: string) {
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

	[$('#weight-he').value, $('#weight-atk').value, $('#weight-hp').value] = preset;
}

function handle_respec(respec: boolean) {
	let owned = game ? game.resources.helium.owned : 0;
	$('#helium').value = input('helium') + owned * (respec ? -1 : 1);
}

function update_dg() {
	let max_zone = $('#zone').value / 2 + 115;
	let eff = 500e6 + 50e6 * game.generatorUpgrades.Efficiency.upgrades;
	let capa = 3 + 0.4 * game.generatorUpgrades.Capacity.upgrades;
	let max_fuel = game.permanentGeneratorUpgrades.Storage.owned ? capa * 1.5 : capa;
	let supply = 230 + 2 * game.generatorUpgrades.Supply.upgrades;
	let overclock = game.generatorUpgrades.Overclocker.upgrades;
	overclock = overclock && (1 - 0.5 * pow(0.99, overclock - 1));
	let burn = game.permanentGeneratorUpgrades.Slowburn.owned ? 0.4 : 0.5;
	let cells = game.talents.magmaFlow ? 18 : 16;
	let accel = game.talents.quickGen ? 1.03 : 1.02;
	let hs2 = game.talents.hyperspeed2 ? (game.global.highestLevelCleared + 1) / 2 : 0;
	let bs = 0.5*game.talents.blacksmith + 0.25*game.talents.blacksmith2 + 0.15*game.talents.blacksmith3;
	bs *= game.global.highestLevelCleared + 1;
	let housing = 0;
	let fuel = 0;
	let time = 0;

	function tick(mult: number) {
		housing += mult * eff * sqrt(min(capa, fuel));
		fuel -= burn;
	}

	for (let zone = 230; zone <= max_zone; ++zone) {
		fuel += cells * (0.01 * min(zone, supply) - 2.1);

		let tick_time = ceil(60 / pow(accel, floor((zone - 230) / 3)));
		time += zone > bs ? 28 : zone > hs2 ? 20 : 15;
		while (time >= tick_time) {
			time -= tick_time;
			tick(1);
		}

		while (fuel > max_fuel)
			tick(overclock)

		housing *= 1.009;
	}

	while (fuel >= burn)
		tick(1);

	$("#dg").value = floor(housing);
}

function read_save() {
	// Auto-fill for the lazy
	if (!localStorage.zone)
		$('#zone').value = game.stats.highestVoidMap.valueTotal || game.global.highestLevelCleared;
	let zone = $('#zone').value;

	if (!localStorage['weight-he'] && !localStorage['weight-atk'] && !localStorage['weight-hp']) {
		$$('#preset > *').forEach(function (option: HTMLOptionElement) {
			option.selected = +option.innerHTML.replace('z', '') < game.global.highestLevelCleared;
		});
		select_preset($('#preset').value);
	}

	// He / unlocks
	let helium = game.global.heliumLeftover;
	for (let perk in game.portal)
		helium += game.portal[perk].heliumSpent;

	let unlocks = Object.keys(game.portal).filter(perk => !game.portal[perk].locked);
	if (!game.global.canRespecPerks)
		unlocks = unlocks.map(perk => perk + '>' + game.portal[perk].level);

	// Income
	let tt = game.talents.turkimp4 ? 1 :
	         game.talents.turkimp3 ? 0.6 :
	         game.talents.turkimp2 ? 0.4 :
	         game.talents.turkimp ? 0.3 : 0.25;
	let prod = 1 + tt;
	let loot = 1 + 0.333 * tt;
	let spires = min(floor((zone - 101) / 100), game.global.spiresCompleted);
	loot *= zone < 100 ? 0.7 : 1 + (game.talents.stillRowing ? 0.3 : 0.2) * spires;

	let chronojest = 27 * game.unlocks.imps.Jestimp + 15 * game.unlocks.imps.Chronoimp;
	let cache = zone < 60 ? 0 : zone < 85 ? 7 : zone < 160 ? 10 : zone < 185 ? 14 : 20;
	chronojest += (game.talents.mapLoot2 ? 5 : 4) * cache;

	for (let mod of (game.global.StaffEquipped.mods || [])) {
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

const parse_inputs = (preset: string) => ({
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
		dg: preset == 'nerfed' ? 0 : input('dg'),
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
});

function display(results: any) {
	let [he_left, perks] = results;

	$('#results').style.opacity = 1;
	$('#info').innerText = localStorage.more ? 'Less info' : 'More info';
	$('#he-left').innerHTML = prettify(he_left) + ' Helium Left Over';
	$('#perks').innerHTML = perks.filter((p: Perk) => !p.locked).map((perk: Perk) => {
		let {name, level, cap, spent} = perk;
		let diff = game ? level - game.portal[perk.name].level : 0;
		let diff_text = diff ? ` (${diff > 0 ? '+' : '-'}${prettify(abs(diff))})` : '';
		let style = diff > 0 ? 'adding' : diff < 0 ? 'remove' : level >= cap ? 'capped' : '';

		return `<div class='perk ${style} ${localStorage.more}'>`
			+ `<b>${name.replace('_', ' ')}</b><br>`
			+ `Level: <b>${prettify(level)}${diff_text}</b><br><span class=more>`
			+ `Price: ${level >= cap ? '∞' : prettify(perk.cost())}<br>`
			+ `Spent: ${prettify(spent)}</span></div>`;
	}).join('');
}

function main() {
	let preset = $('#preset').value;

	if (preset == 'trapper' && (!game || game.global.challengeActive != 'Trapper'))
		throw 'This preset requires a save currently running Trapper². Start a new run using “Trapper² (initial)”, export, and try again.';

	let inputs = parse_inputs(preset);
	let max_zone = game ? game.global.highestLevelCleared : 999;

	if ((preset.match(/trimp|coord/) && inputs.zone >= max_zone / 2)
			|| (preset === 'trapper' && inputs.zone >= max_zone - 40))
		show_alert('warning', 'Your target zone seems too high for this c², try lowering it.');

	if (preset == 'spire' && game && game.global.world != 100 * (2 + game.global.lastSpireCleared))
		show_alert('warning', 'This preset is meant to be used mid-run, when you’re done farming for the Spire.');

	display(optimize(inputs));
}

function toggle_info() {
	localStorage.more = localStorage.more ? '' : 'more';
	$$('.perk').forEach((elem: HTMLElement) => elem.classList.toggle('more'));
	$('#info').innerText = localStorage.more ? 'Less info' : 'More info';
}

// Total bonus from an additive perk. `x` is the percentage from each level.
const add = (perk: Perk, x: number) => 1 + perk.level * x / 100;

// Total bonus from a compounding perk. `x` is the percentage from each level.
const mult = (perk: Perk, x: number) => pow(1 + x / 100, perk.level);

function parse_perks(fixed: string, unlocks: string) {
	let perks = [
		new Perk('Looting_II',     100e3, 10e3, Infinity, 1e4),
		new Perk('Carpentry_II',   100e3, 10e3, Infinity, 1e4),
		new Perk('Motivation_II',  50e3,  1e3,  Infinity, 1e4),
		new Perk('Power_II',       20e3,  500,  Infinity, 1e4),
		new Perk('Toughness_II',   20e3,  500,  Infinity, 1e4),
		new Perk('Overkill',       1e6,   0,    30,       1e4),
		new Perk('Resourceful',    50e3,  0,    Infinity, 1e6),
		new Perk('Coordinated',    150e3, 0,    Infinity, 1e4),
		new Perk('Siphonology',    100e3, 0,    3,        1e4),
		new Perk('Anticipation',   1000,  0,    10,       1e4),
		new Perk('Resilience',     100,   0,    Infinity, 1e4),
		new Perk('Meditation',     75,    0,    7,        1e4),
		new Perk('Relentlessness', 75,    0,    10,       1e4),
		new Perk('Carpentry',      25,    0,    Infinity, 1e4),
		new Perk('Artisanistry',   15,    0,    Infinity, 1e4),
		new Perk('Range',          1,     0,    10,       1e4),
		new Perk('Agility',        4,     0,    20,       1e4),
		new Perk('Bait',           4,     0,    Infinity, 1e7),
		new Perk('Trumps',         3,     0,    Infinity, 1e8),
		new Perk('Pheromones',     3,     0,    Infinity, 1e6),
		new Perk('Packrat',        3,     0,    Infinity, 1e7),
		new Perk('Motivation',     2,     0,    Infinity, 1e4),
		new Perk('Power',          1,     0,    Infinity, 1e4),
		new Perk('Toughness',      1,     0,    Infinity, 1e4),
		new Perk('Looting',        1,     0,    Infinity, 1e4),
	];

	if (!unlocks.match(/>/))
		unlocks = unlocks.replace(/(?=,|$)/g, '>0');

	for (let item of (unlocks + ',' + fixed).split(/,/).filter(x => x)) {
		let m = item.match(/(\S+) *([<=>])=?(.*)/);
		if (!m)
			throw 'Enter a list of perk levels, such as “power=42, toughness=51”.';

		let tier2 = m[1].match(/2$|II$/);
		let name = m[1].replace(/[ _]?(2|II)/i, '').replace(/^OK/i, 'O').replace(/^Looty/i, 'L');
		let regex = new RegExp(`^${name}[a-z]*${tier2 ? '_II' : ''}$`, 'i');
		let matches = perks.filter(p => p.name.match(regex));

		if (matches.length > 1)
			throw `Ambiguous perk abbreviation: ${m[1]}.`;
		if (matches.length < 1)
			throw `Unknown perk: ${m[1]}.`;

		let level = parse_suffixes(m[3]);
		if (!isFinite(level))
			throw `Invalid number: ${m[3]}.`;

		matches[0].locked = false;
		if (m[2] != '>')
			matches[0].cap = level;
		if (m[2] != '<')
			matches[0].must = level;
	}

	return perks;
}

function optimize(params: any) {
	let {he_left, zone, perks, weight, mod} = params;
	let [
		Looting_II, Carpentry_II, Motivation_II, Power_II, Toughness_II,
		Overkill, Resourceful, Coordinated, Siphonology, Anticipation,
		Resilience, Meditation, Relentlessness, Carpentry, Artisanistry,
		Range, Agility, Bait, Trumps, Pheromones,
		Packrat, Motivation, Power, Toughness, Looting
	] = perks;

	for (let perk of perks)
		if (perk.name.endsWith('_II'))
			perk.pack = pow(10, max(0, floor(log(he_left) / log(100) - 4.2)));

	for (let name of ['whip', 'magn', 'taunt', 'ven'])
		mod[name] = pow(1.003, zone * 99 * 0.03 * mod[name]);

	const books = pow(1.25, zone) * pow(zone > 100 ? 1.28 : 1.2, max(zone - 59, 0));
	const gigas = max(0, min(zone - 60, zone/2 - 25, zone/3 - 12, zone/5, zone/10 + 17, 39));
	const base_housing = pow(1.25, min(zone / 2, 30) + gigas);
	const mystic = zone >= 25 ? floor(min(zone / 5, 9 + zone / 25, 15)) : 0;
	const tacular = (20 + zone - zone % 5) / 100;
	const base_income = 600 * mod.whip * books;
	const base_helium = pow(zone - 19, 2);
	const max_tiers = zone / 5 + +((zone - 1) % 10 < 5);
	const exp = {
		cost: pow(1.069, 0.85 * (zone < 60 ? 57 : 53)),
		attack: pow(1.19, 13),
		health: pow(1.19, 14),
		block: pow(1.19, 10),
	};
	const equip_cost = {
		attack: 211 * (weight.attack + weight.health) / weight.attack,
		health: 248 * (weight.attack + weight.health) / weight.health,
		block:    5 * (weight.attack + weight.health) / weight.health,
	};

	// Number of ticks it takes to one-shot an enemy.
	function ticks() {
		return 1 + +(Agility.level < 3) + ceil(10 * mult(Agility, -5));
	}

	const moti = () => add(Motivation, 5) * add(Motivation_II, 1);
	const looting = () => add(Looting, 5) * add(Looting_II, 0.25);

	function income(ignore_prod?: boolean) {
		let storage = mod.storage * mult(Resourceful, -5) / add(Packrat, 20);
		let loot = looting() * mod.magn / ticks();
		let prod = ignore_prod ? 0 : moti() * add(Meditation, 1) * mod.prod;
		let chronojest = mod.chronojest * 0.1 * prod * loot;
		return base_income * (prod + loot * mod.loot + chronojest) * (1 - storage);
	}

	// Max population
	const trimps = mod.tent_city ? () => {
		let carp = mult(Carpentry, 10) * add(Carpentry_II, 0.25);
		let territory = add(Trumps, 20);
		return 10 * (mod.taunt + territory * (mod.taunt - 1) * 111) * carp;
	} : () => {
		let carp = mult(Carpentry, 10) * add(Carpentry_II, 0.25);
		let bonus = 3 + max(log(income() / base_income * carp / mult(Resourceful, -5)), 0);
		let territory = add(Trumps, 20) * zone;
		return 10 * (base_housing * bonus + territory) * carp * mod.taunt + mod.dg * carp;
	};

	function equip(stat: "attack" | "health" | "block") {
		let cost = equip_cost[stat] * mult(Artisanistry, -5);
		let levels = 1.136;
		let tiers = log(1 + income() * trimps() / cost) / log(exp.cost);

		if (tiers > max_tiers + 0.45) {
			levels = log(1 + pow(exp.cost, tiers - max_tiers) * 0.2) / log(1.2);
			tiers = max_tiers;
		}
		return levels * pow(exp[stat], tiers);
	}

	// Number of buildings of a given kind that can be built with the current income.
	// cost: base cost of the buildings
	// exp: cost increase for each new level of the building
	function building(cost: number, exp: number) {
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
		let nurseries = building(2e6, 1.06) / (1 + 0.1 * min(magma(), 20));
		let potency = 0.0085 * (zone >= 60 ? 0.1 : 1) * pow(1.1, floor(zone / 5));
		return potency * pow(1.01, nurseries) * add(Pheromones, 10) * mod.ven;
	}

	let group_size: number[] = [];

	for (let coord = 0; coord <= log(1 + he_left / 500e3) / log(1.3); ++coord) {
		let ratio = 1 + 0.25 * pow(0.98, coord);
		let result = 1;
		for (let i = 0; i < 100; ++i)
			result = ceil(result * ratio);
		group_size[coord] = result / pow(ratio, 100);
	}

	// Theoretical fighting group size (actual size is lower because of Coordinated)
	function soldiers() {
		let ratio = 1 + 0.25 * mult(Coordinated, -2);
		let pop = (mod.soldiers || trimps()) / 3;
		if (mod.soldiers > 1)
			pop += 36000 * add(Bait, 100);
		let coords = log(pop / group_size[Coordinated.level]) / log(ratio);
		let available = zone - 1 + (magma() ? 100 : 0);
		return group_size[0] * pow(1.25, min(coords, available));
	}

	// Total attack
	function attack() {
		let attack = (0.15 + equip('attack')) * pow(0.8, magma());
		attack *= add(Power, 5) * add(Power_II, 1);
		attack *= add(Relentlessness, 5 * add(Relentlessness, 30));
		attack *= pow(1 + Siphonology.level, 0.1) * add(Range, 1);
		attack *= add(Anticipation, 6);
		return soldiers() * attack;
	}

	// Total survivability (accounts for health and block)
	function health() {
		let health = (0.6 + equip('health')) * pow(0.8, magma());
		health *= add(Toughness, 5) * add(Toughness_II, 1) * mult(Resilience, 10);

		// block
		let gyms = building(400, 1.185);
		let trainers = (gyms * log(1.185) - log(1 + gyms)) / log(1.1) + 25 - mystic;
		let block = 0.04 * gyms * pow(1 + mystic / 100, gyms) * (1 + tacular * trainers);

		// target number of attacks to survive
		let attacks = 60;

		if (zone < 70) { // no geneticists
			// number of ticks needed to repopulate an army
			let timer = log(1 + soldiers() * breed() / add(Bait, 100)) / log(1 + breed());
			attacks = timer / ticks();
		}

		else { // no geneticists
			let ratio = 1 + 0.25 * mult(Coordinated, -2);
			let available = zone - 1 + (magma() ? 100 : 0);
			let required = group_size[Coordinated.level] * pow(ratio, available);
			let fighting = min(required / trimps(), 1 / 3);
			let target_speed = fighting > 1e-9 ?
				(pow(0.5 / (0.5 - fighting), 0.1 / mod.breed_timer) - 1) * 10 :
				fighting / mod.breed_timer;
			let geneticists = log(breed() / target_speed) / -log(0.98);
			health *= pow(1.01, geneticists);
		}

		health /= attacks;
		if (zone < 60)
			block += equip('block');
		else
			block = min(block, 4 * health);

		return soldiers() * (block + health);
	}

	const agility = () => 1 / mult(Agility, -5);
	const helium = () => base_helium * looting() + 45;
	const overkill = () => add(Overkill, 100);

	const stats: {[key: string]: () => number} = { agility, helium, attack, health, overkill, trimps };

	function score() {
		let result = 0;
		for (let i in weight) {
			if (!weight[i])
				continue;
			let stat = stats[i]();
			if (!isFinite(stat))
				throw Error(i + ' is ' + stat);
			result += weight[i] * log(stat);
		}

		return result;
	}

	function best_perk(): Perk {
		let best;
		let max = 0;
		let baseline = score();

		for (let perk of perks) {
			if (perk.locked || perk.level >= perk.cap || perk.cost() > he_left)
				continue;

			perk.level += perk.pack;
			let gain = score() - baseline;
			perk.level -= perk.pack;

			let efficiency = gain / perk.cost();
			if (efficiency >= max) {
				max = efficiency;
				best = perk;
			}
		}

		return best;
	}

	mod.loot *= 20.8; // TODO: check that this is correct
	weight.agility = (weight.helium + weight.attack) / 2;
	weight.overkill = 0.25 * weight.attack * (2 - pow(0.9, weight.helium / weight.attack));

	if (zone > 110 && mod.soldiers <= 1 && Bait.must == 0)
		Bait.cap = 0;

	for (let perk of perks) {
		while (perk.level < perk.must) {
			he_left -= perk.cost();
			perk.level += perk.pack;
		}
	}

	if (he_left < 0)
		throw "You don’t have enough Helium to afford your Fixed Perks.";

	// Main loop
	for (let best; (best = best_perk()); ) {
		let spent = 0;
		while (best.level < best.cap && (best.level < best.must || spent < he_left / best.free)) {
			he_left -= best.cost();
			spent += best.cost();
			best.level += best.pack;
			if (best.level == 1000 * best.pack)
				best.pack *= 10;
		}
		best.spent += spent;
	}

	for (let perk of perks)
		console.log(perk.name, '=', perk.level);

	return [he_left, perks];
}
