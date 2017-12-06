ALL := $(wildcard *.pug *.html *.styl *.css *.ts)
ALL := $(ALL:.pug=.html)
ALL := $(ALL:.styl=.css)
ALL := $(ALL:.ts=.js)

all: $(addprefix docs/, $(ALL))

docs/zfarm.js: trimps.ts lz-string.js
docs/perks.js: trimps.ts lz-string.js

docs/%.html: %.pug index.pug
	pug $^ -o docs

docs/%.css: %.styl
	stylus -c <$^ >$@

docs/%.js: %.ts
	tsc -t ES5 --allowJs --strict --noUnusedLocals --outFile $@ $^
	uglify -s $@ -o $@

docs/%: %
	cp $^ $@
