ALL := $(wildcard *.pug *.scss *.ts)
ALL := $(ALL:.pug=.html)
ALL := $(ALL:.scss=.css)
ALL := $(ALL:.ts=.js)
ALL := $(addprefix docs/, $(ALL))

all: $(ALL)

docs/%.html: %.pug index.pug
	pug --pretty $^ -o docs

docs/%.css: %.scss
	scss -t compressed $^ $@

docs/%.js: %.ts
	tsc -t ES5 --strict --outFile $@ $^
