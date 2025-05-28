import Vue from 'vue';
import Vuex from 'vuex';
import { notes } from './modules/notes';
import { categories } from './modules/categories';
import { tags } from './modules/tags';
import { user } from './modules/user';

Vue.use(Vuex);

export interface RootState {
  version: string;
}

export default new Vuex.Store<RootState>({
  state: {
    version: '1.0.0',
  },
  modules: {
    notes,
    categories,
    tags,
    user,
  },
  strict: process.env.NODE_ENV !== 'production',
});
