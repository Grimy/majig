module Jekyll

	class TsGenerator < Generator
		safe true
		priority :low

		def generate(site)
			ts_files = Array.new;

			site.static_files.delete_if do |sf|
				next if not File.extname(sf.path) == ".ts"
				ts_dir = File.dirname(sf.path.gsub(site.source, ""))
				ts_name = File.basename(sf.path)
				ts_files << TsFile.new(site, site.source, ts_dir, ts_name)
				true
			end

			site.static_files.concat(ts_files)
		end
	end


	class TsFile < StaticFile
		def initialize(site, base, dir, name)
			super(site, base, dir, name, nil)
			@tspath = File.join(base, dir, name)
		end

		def write(dest)
			puts "\e[35m#{@tspath}\e[m"
			puts `tsc -t ES6 --outDir _site #{@tspath}`
		end
	end
end