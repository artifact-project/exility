#!/usr/bin/env bash

command="$1"
export EXILITY_STORYBOOK_DIRNAME=`pwd`;

if [ "$command" == "start" ]; then
	cd node_modules/@exility/storybook/node_modules/.bin/
	npm start
fi

if [ "$command" == "build" ]; then
	echo "START BUILDING"
fi
