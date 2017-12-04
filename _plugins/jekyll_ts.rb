module Jekyll
	class TsGenerator < Generator
		safe true
		priority :low

		def generate(site)
			site.static_files = site.static_files.map { |sf|
				next sf if not File.extname(sf.path) == ".ts"
				ts_dir = File.dirname(sf.path.gsub(site.source, ""))
				ts_name = File.basename(sf.path)
				TsFile.new(site, site.source, ts_dir, ts_name)
			}
		end
	end

	class TsFile < StaticFile
		def initialize(site, base, dir, name)
			super(site, base, dir, name, nil)
			@tspath = File.join(base, dir, name)
			@jspath = File.join(base, dir, '_site', name.sub('.ts', '.js'))
		end

		def write(dest)
			puts "\n\e[35m#{@tspath}\e[m"
			print `tsc -t ES5 --outFile #{@jspath} #{@tspath}`
		end
	end
end