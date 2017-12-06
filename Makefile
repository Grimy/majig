ALL := $(wildcard *.pug *.styl *.ts)
ALL := $(ALL:.pug=.html)
ALL := $(ALL:.styl=.css)
ALL := $(ALL:.ts=.js)
ALL := $(addprefix docs/, $(ALL))

all: $(ALL)

docs/%.html: %.pug index.pug
	pug $^ -o docs

docs/%.css: %.styl
	stylus -c <$^ >$@

docs/%.js: %.ts
	tsc -t ES5 --strict --outFile $@ $^
