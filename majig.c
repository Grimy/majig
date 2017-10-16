// chore.h - global types and vars definitions

#include <assert.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// Convenient names for integer types
typedef uint8_t  u8;
typedef uint16_t u16;
typedef uint32_t u32;
typedef uint64_t u64;

typedef int8_t   i8;
typedef int16_t  i16;
typedef int32_t  i32;
typedef int64_t  i64;

// Some basic utility macros/functions
#define UNUSED __attribute__((unused))
// #define ARRAY_SIZE(arr) ((i64) (sizeof(arr) / sizeof((arr)[0])))
// #define streq(a, b) (!strcmp((a), (b)))

template <class T> constexpr T sign(T x)       { return (x > 0) - (x < 0); }
template <class T> constexpr T abs(T x)        { return x < 0 ? -x : x; }
template <class T> constexpr T min(T x, i64 y) { return x < (T) y ? x : (T) y; }
template <class T> constexpr T max(T x, i64 y) { return x > (T) y ? x : (T) y; }

enum Target {
	NONE,
	ANY_ENEMY,
	ANY_FRIEND,
};

enum Buff {
	SHIELD,
	BUFF_COUNT,
};

struct Majig;

typedef bool (*Condition)(const Majig*);
typedef void (*Skill)(const Majig*, Majig*);

struct Gambit {
	Condition condition;
	Skill skill;
	Target target;
};

struct Majig {
	i32 damage;
	i32 hp;
	struct Gambit gambits[8];
	u8 buffs[BUFF_COUNT];
};

// END .h

// conditions

static bool always(UNUSED const Majig *target)
{
	return true;
}

static bool is_not_shielded(const Majig *target)
{
	return target->buffs[SHIELD] == 0;
}

// skills

static void attack(const Majig *source, Majig *target)
{
	int damage = source->damage;

	if (target->buffs[SHIELD])
		damage /= 2;

	target->hp -= damage;
}

static void shield(UNUSED const Majig *source, Majig *target)
{
	target->buffs[SHIELD] = 5;
}

static Majig player = { 5, 60, {
	{ is_not_shielded, shield, ANY_FRIEND },
	{ always, attack, ANY_ENEMY },
}};
static Majig enemy;

static void next_enemy()
{
	enemy.damage = 2;
	enemy.hp = 40;
	enemy.gambits[0] = (Gambit) { always, attack, ANY_FRIEND };
}

static void majig_turn(Majig *majig)
{
	for (i64 i = 0; i < BUFF_COUNT; ++i)
		if (majig->buffs[i])
			--majig->buffs[i];

	for (Gambit gambit: majig->gambits) {
		Majig *target;

		switch (gambit.target) {
		case NONE: continue;
		case ANY_ENEMY: target = &enemy; break;
		case ANY_FRIEND: target = &player; break;
		}

		if (gambit.condition(target)) {
			gambit.skill(majig, target);
			break;
		}
	}
}

int main(void)
{
	player.damage = 5;
	player.hp = 60;

	for (;;) {
		if (player.hp <= 0)
			return 0;

		if (enemy.hp <= 0)
			next_enemy();

		majig_turn(&player);
		majig_turn(&enemy);
		printf("player hp = %d, enemy hp = %d, player shield = %d\n", player.hp, enemy.hp, player.buffs[SHIELD]);
	}
}
