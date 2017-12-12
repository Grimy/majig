ALL := $(wildcard *.pug *.html *.styl *.css *.ts *.js)
ALL := $(ALL:.pug=.html)
ALL := $(ALL:.styl=.css)
ALL := $(ALL:.ts=.js)

all: $(addprefix docs/, $(ALL))

docs/%.html: %.pug index.pug
	pug $^ -o docs

docs/%.css: %.styl
	stylus -c <$^ >$@

%.js: %.ts
	tsc -t ES5 --strict --noUnusedLocals --outFile $@ $^

docs/%.js: %.js
	uglify -s $^ -o $@

docs/%: %
	cp $^ $@
