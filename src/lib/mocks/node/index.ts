import nodeModule from './001_node_module';
import nodeHttpModule from './002_node_httpModule';
import nodeFileSystem from './003_node_fileSystem';
import nodeUrlModule from './004_node_urlModule';
import nodeNpm from './005_node_npm';
import nodeEvents from './006_node_events';
import nodeUploadFiles from './007_node_uploadFiles';
import nodeEmail from './008_node_email';
import nodeSqlDatabase from './009_node_sqlDatabase';
import nodeSqlCreateTable from './010_node_sqlCreateTable';
import nodeSqlInertInto from './011_node_sqlInsertInto';
import nodeSqlSelectForm from './012_node_sqlSelectForm';
import nodeSqlWhere from './013_node_sqlWhere';
import nodeSqlOrderBy from './014_node_sqlOrderBy';
import nodeSqlDelete from './015_node_sqlDelete';
import nodeSqlDropTable from './016_node_sqlDropTable';
import nodeSqlUpdate from './017_node_sqlUpdate';
import nodeSqlLimit from './018_node_sqlLimit';
import nodeSqlJoin from './019_node_sqlJoin';
import nodeMongoDBDatabase from './020_node_mongodbDatabase';


export const NODE_IDS: { [key: string]: string } = {
  NODE_MODULE: 'NODE_MODULE',
  NODE_HTTPMODULE: 'NODE_HTTPMODULE',
  NODE_FILESYSTEM: 'NODE_FILESYSTEM',
  NODE_URLMODULE: 'NODE_URLMODULE',
  NODE_NPM: 'NODE_NPM',
  NODE_EVENTS: 'NODE_EVENTS',
  NODE_UPLOADFILES: 'NODE_UPLOADFILES',
  NODE_EMAIL: 'NODE_EMAIL',
  NODE_SQLDATABASE: 'NODE_SQLDATABASE',
  NODE_SQLCREATETABLE: 'NODE_SQLCREATETABLE',
  NODE_SQLINSERTINTO: 'NODE_SQLINSERTINTO',
  NODE_SQLSELECTFORM: 'NODE_SQLSELECTFORM',
  NODE_SQLWHERE: 'NODE_SQLWHERE',
  NODE_SQLORDERBY: 'NODE_SQLORDERBY',
  NODE_SQLDELETE: 'NODE_SQLDELETE',
  NODE_SQLDROPTABLE: 'NODE_SQLDROPTABLE',
  NODE_SQLUPDATE: 'NODE_SQLUPDATE',
  NODE_SQLLIMIT: 'NODE_SQLLIMIT',
  NODE_SQLJOIN: 'NODE_SQLJOIN',
  NODE_MONGODBDATABASE: 'NODE_MONGODBDATABASE',
};

export const NODE_TEMPLATES = {
  [NODE_IDS.NODE_MODULE]: nodeModule,
  [NODE_IDS.NODE_HTTPMODULE]: nodeHttpModule,
  [NODE_IDS.NODE_FILESYSTEM]: nodeFileSystem,
  [NODE_IDS.NODE_URLMODULE]: nodeUrlModule,
  [NODE_IDS.NODE_NPM]: nodeNpm,
  [NODE_IDS.NODE_EVENTS]: nodeEvents,
  [NODE_IDS.NODE_UPLOADFILES]: nodeUploadFiles,
  [NODE_IDS.NODE_EMAIL]: nodeEmail,
  [NODE_IDS.NODE_SQLDATABASE]: nodeSqlDatabase,
  [NODE_IDS.NODE_SQLCREATETABLE]: nodeSqlCreateTable,
  [NODE_IDS.NODE_SQLINSERTINTO]: nodeSqlInertInto,
  [NODE_IDS.NODE_SQLSELECTFORM]: nodeSqlSelectForm,
  [NODE_IDS.NODE_SQLWHERE]: nodeSqlWhere,
  [NODE_IDS.NODE_SQLORDERBY]: nodeSqlOrderBy,
  [NODE_IDS.NODE_SQLDELETE]: nodeSqlDelete,
  [NODE_IDS.NODE_SQLDROPTABLE]: nodeSqlDropTable,
  [NODE_IDS.NODE_SQLUPDATE]: nodeSqlUpdate,
  [NODE_IDS.NODE_SQLLIMIT]: nodeSqlLimit,
  [NODE_IDS.NODE_SQLJOIN]: nodeSqlJoin,
  [NODE_IDS.NODE_MONGODBDATABASE]: nodeMongoDBDatabase,
};
