/*
* @Author: HellMagic
* @Date:   2016-04-09 22:26:48
* @Last Modified by:   HellMagic
* @Last Modified time: 2016-05-25 20:54:37
*/

'use strict';


import Immutable from 'immutable';

import {fetchDashboardData} from '../../api/exam';
import {
    INIT_DASHBOARD
} from '../../lib/constants';

export function initDashboardAction(params) {
    return {
        type: INIT_DASHBOARD,
        promise:fetchDashboardData(params)
    }
}

// export function initExamGuide() {
//     return {
//         type: INIT_GLOBAL_GUIDE,
//         promise: getMockExamGuide()
//     }
// }

// export function initScoreRank() {
//     return {
//         type: INIT_SCORE_RANK,
//         promise:getMockScoreRank()
//     }
// }

// export function initClassReport() {
//     return {
//         type: INIT_CLASS_REPORT,
//         promise: getMockClassReport()
//     }
// }

// export function initLevelReport() {
//     return {
//         type: INIT_LEVEL_REPORT,
//         promise: getMockLevelReport()
//     }
// }

// export function initSubjectReport() {
//     return {
//         type: INIT_SUBJECT_REPORT,
//         promise: getMockSubjectReport()
//     }
// }
