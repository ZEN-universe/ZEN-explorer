# To run this file install the following NPM packages:
# npm install -g topojson-client topojson-server topojson-simplify ndjson-cli shapefile d3-geo-projection

# Thanks to Mike Bostock for this nice tutorial on how to create TopoJSON files:
# https://medium.com/@mbostock/command-line-cartography-part-1-897aa8f8ca2c

# Commands to recreate the world and NUTS files
default: all clean
all: world nuts
world: src/topojson/world-3.json
nuts: src/topojson/nuts-1.json src/topojson/nuts-2.json src/topojson/nuts-3.json
clean:
	rm -f world-*.zip world-*.shp world-*.ndjson world-*.json nuts-*.json combined-*.json
.PHONY: default all world nuts clean

# Download and process NUTS data
nuts-cntrg.json:
	curl -o $@ https://raw.githubusercontent.com/eurostat/Nuts2json/refs/heads/master/pub/v2/2024/4326/10M/cntrg.json
	@touch $@

nuts-nutsrg-%.json:
	curl -o $@ https://raw.githubusercontent.com/eurostat/Nuts2json/refs/heads/master/pub/v2/2024/4326/10M/nutsrg_$*.json
	@touch $@

combined-nuts-%.json: nuts-nutsrg-%.json nuts-nutsrg-0.json nuts-cntrg.json
	geo2topo land=nuts-cntrg.json countries=nuts-nutsrg-0.json regions=nuts-nutsrg-$*.json \
		| topomerge land=land -o $@

# Download and process world data
# Adapted from https://github.com/topojson/world-atlas/blob/master/prepublish
world-%.zip:
	curl -o $@ https://naciscdn.org/naturalearth/$*/cultural/ne_$*_admin_0_countries.zip
	@touch $@

world-%.shp: world-%.zip
	unzip -o $< ne_$*_admin_0_countries.shp
	mv ne_$*_admin_0_countries.shp $@
	@touch $@

world-%.ndjson: world-%.shp
	shp2json --encoding utf8 -n $< \
		| ndjson-map 'i = d.properties.ISO_N3, d.id = i === "-99" ? (d.properties.SOV_A3 === "NOR" ? "578" : undefined) : i, d.properties = {name: d.properties.NAME}, d' \
		> $@

world-%.json: world-%.ndjson
	geo2topo -n countries=$< \
		| topomerge land=countries \
		> $@

combined-world-1.json: world-110m.json
	mv $< $@
combined-world-2.json: world-50m.json
	mv $< $@
combined-world-3.json: world-10m.json
	mv $< $@

src/topojson/%.json: combined-%.json
	@mkdir -p `dirname $@`
	toposimplify -s 0.000003 -F -o $@ $<

# Convert TopoJSON to SVG for debugging purposes
# Applies a mercator projection that centers on Europe
%.svg: %.json
	topo2geo countries=- < "$<" \
		| geoproject 'd3.geoMercator().scale(660).center([20, 54])' \
		| ndjson-split 'd.features' \
		| geo2svg -n --fill green --stroke black -p 6 -w 960 -h 960 \
		> "$@"
