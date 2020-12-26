const fs = require('fs');

const type = process.argv[2];

const pkg = require('../package_template.json');
for (const key in pkg['merge-configs'][type]) {
	Object.assign(pkg[key], pkg['merge-configs'][type][key]);
}
delete pkg['merge-configs'];
fs.writeFileSync(
	__dirname + '/../package.json',
	JSON.stringify(pkg, null, '  ') + '\n'
);
