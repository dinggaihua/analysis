/*
* @Author: HellMagic
* @Date:   2016-04-08 17:02:04
* @Last Modified by:   HellMagic
* @Last Modified time: 2016-10-15 11:59:07
*/

'use strict';

import gloablInitState from './global-app-state';
import homeInitState from './home-state';
import dashboardInitState from './dashboard-state';
import reportDS from './report-state';
import rankReportState from './rank-report-state';
import classReportState from './class-report-state';
import customAnalysisState from './custom-analysis-state';
import examsCacheState from './exams-cache-state';
import helperState from './helper-state';
import zoubanState from './zouban-state';

// import liankaoState from './liankao-report-state';
// liankaoReport: new liankaoState,

import {initOne, initTwo} from './test-state';

var _initState = {
    global: new gloablInitState,
    home: new homeInitState,
    dashboard: new dashboardInitState,
    reportDS: new reportDS,
    rankReport: new rankReportState,
    classReport: new classReportState,
    customAnalysis: new customAnalysisState,
    examsCache: new examsCacheState,
    helper: new helperState,
    zouban:new zoubanState,
    //设计成使用嵌套的reducer
    test: {
        one: initOne,
        two: initTwo
    }
};

export default _initState;
