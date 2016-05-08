bin/denymount: src/denymount.m
	clang -Wall -Werror $< \
		-lobjc \
		-framework DiskArbitration \
		-framework Foundation \
		-o $@
