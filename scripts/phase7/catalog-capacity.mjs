import {startFixture} from '../phase3/local-fixture.mjs';
import {seedCatalog} from '../../tests/phase5/fixture.mjs';
import {catalogCapacity} from '../../tests/phase7/performance.mjs';
const f=await startFixture();
try{await catalogCapacity(f,await seedCatalog(f));}finally{await f.close();}
