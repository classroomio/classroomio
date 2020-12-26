#!/bin/bash
cd "$(dirname "$0")"

if [ "$CI" ]; then
	(umask 0077; echo "$SSH_KEY" > ~/ssh_key; echo "$SSH_KEY_ROLLUP" > ~/ssh_key_rollup; echo "$SSH_KEY_WEBPACK" > ~/ssh_key_webpack)
	git config user.email 'noreply@svelte.dev'
	git config user.name '[bot]'
fi

# branch names
ROLLUP=rollup
WEBPACK=webpack

./create-branches.sh $ROLLUP $WEBPACK

# force push rollup and webpack branches and repos
GIT_SSH_COMMAND='ssh -o StrictHostKeyChecking=accept-new -i ~/ssh_key' git push git@github.com:sveltejs/sapper-template.git $ROLLUP $WEBPACK -f
GIT_SSH_COMMAND='ssh -o StrictHostKeyChecking=accept-new -i ~/ssh_key_rollup' git push git@github.com:sveltejs/sapper-template-rollup.git $ROLLUP:master -f
GIT_SSH_COMMAND='ssh -o StrictHostKeyChecking=accept-new -i ~/ssh_key_webpack' git push git@github.com:sveltejs/sapper-template-webpack.git $WEBPACK:master -f
