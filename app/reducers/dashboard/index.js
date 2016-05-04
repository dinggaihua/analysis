/*
* @Author: HellMagic
* @Date:   2016-04-08 17:16:06
* @Last Modified by:   HellMagic
* @Last Modified time: 2016-05-04 16:08:09
*/

'use strict';

import _ from 'lodash';

import InitialState from '../../states/dashboard-state';

var initialState = new InitialState;

import {
    INIT_GLOBAL_GUIDE_SUCCESS,
    INIT_SCORE_RANK_SUCCESS,
    INIT_CLASS_REPORT_SUCCESS,
    INIT_LEVEL_REPORT_SUCCESS,
    INIT_SUBJECT_REPORT_SUCCESS,
    SOME_HOME_ONE,
    SOME_HOME_TWO,
    SOME_HOME_THREE
} from '../../lib/constants';


export default function reducer(state, action) {
    if(_.isUndefined(state)) return initialState;
    if(!(state instanceof InitialState)) return initialState.merge(state);

//TODO:注意，因为这里还没有替换成通过axois去异步获取数据，当使用axois的时候解析服务端的数据是 action.res.data而不是 action.res
    switch(action.type) {
        case INIT_GLOBAL_GUIDE_SUCCESS:
            return state.set('examGuide', action.res);
        case INIT_SCORE_RANK_SUCCESS:
            //对应的洗数据逻辑，整理数据格式的操作函数--因为从promise直接发射的就是这个XXX_SUCCESS action，所以需要在这里处理
            return state.set('scoreRank', action.res);
        case INIT_CLASS_REPORT_SUCCESS:
            return state.set('classReport', action.res);
        case INIT_LEVEL_REPORT_SUCCESS:
            return state.set('levelReport', action.res);
        case INIT_SUBJECT_REPORT_SUCCESS:
            return state.set('subjectReport', action.res);
        case SOME_HOME_ONE:
        case SOME_HOME_TWO:
        case SOME_HOME_THREE:
            return state;
    }

    return state;
}
