#!/usr/bin/env bash

command="$1";
command="$2";
STORYBOOK_CONFIG="node_modules/@exility/storybook/.storybook";

export EXILITY_STORYBOOK_DIRNAME=`pwd`;
export EXILITY_STORYBOOK_OUT_DIRNAME="$EXILITY_STORYBOOK_DIRNAME/storybook-static";

if [ "$command" == "start" ]; then
	./node_modules/.bin/start-storybook -p $PORT -c $STORYBOOK_CONFIG
fi

if [ "$command" == "build" ]; then
	./node_modules/.bin/build-storybook -c $STORYBOOK_CONFIG
fi
