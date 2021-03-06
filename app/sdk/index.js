/*
* @Author: HellMagic
* @Date:   2016-09-05 20:15:12
* @Last Modified time: 2016-10-19 11:10:04
*/

'use strict';
import _ from 'lodash';
import StatisticalLib from 'simple-statistics';
/*
    计算一个区间：
        参数：开始值 start；结束值 end；步伐 step；多少个间隔：count(当step为null的时候，通过count来计算step)
        输出：包括start和end的，以step为步伐的计数数组
*/
export function makeSegments(end, start = 0, step, count = 12) {
    step = step || _.ceil(_.divide(_.subtract(end, start), count));
    var result = _.range(start, end + 1, step);
    if (_.last(result) < end) result.push(end);
    return result;
}

export function makeSegmentsString(segments) {
    //左闭右开
    var lastIndex = _.size(segments) - 2;
    return _.map(_.range(_.size(segments)-1), (i) => {
        return '[' + segments[i] + ', ' + segments[i+1] + (i == lastIndex ? ']' : ')') + '分';
    });
}

/*
    求某一个群定的xx属性的区间分布:<注意，因为查找的方式使用了二分法，所以群体必须是有序的！！！>
        参数：区间 segments；群体 base；属性 key
        输出：[
                {
                    low: <此区间的低位>,
                    high: <此区间的高位>,
                    count <分布在此区间的群体个数>:
                    targets: <分布在此区间的群体数组--实体还是传递的实体结构>,
                    index: <区间的索引>
                }, ...
            ]
*/
export function makeSegmentsDistribution(segments, base, key='score') {
    var groupCountDistribution = _.groupBy(base, function(item) {
        return getSegmentIndex(segments, item[key]);
    });

    return _.map(_.range(segments.length - 1), (index) => {
        var count = (groupCountDistribution[index]) ? groupCountDistribution[index].length : 0;
        var targets = (groupCountDistribution[index]) ? groupCountDistribution[index] : [];
        return {
            index: index,
            low: segments[index],
            high: segments[index + 1],
            count: count,
            targets: targets
        }
    });
}


function getSegmentIndex(segments, target) {
    var low = 0,
        high = segments.length - 1;
    while (low <= high) {
        var middle = _.ceil((low + high) / 2);
        if (target == segments[middle]) {
            return (target == _.last(segments)) ? middle - 1 : middle;
        } else if (target < segments[middle]) {
            high = middle - 1;　　
        } else {
            low = middle + 1;
        }
    }
    return high;
}

/**
 * 将一个matrix通过行列操作计算离差
 * @param  {[type]} originalMatrix [description]
 * @return {[type]}                [description]
 */
export function makeFactor(originalMatrix) {
    var tempMatrix = []; //不用map是因为避免占位
    //1.行相减
    _.each(originalMatrix, (classRow, rowIndex) => {
        if (rowIndex == 0) return;
        var rowFactors = _.map(classRow, (perItem, columnIndex) => (_.isNumber(perItem) ? _.round(_.subtract(perItem, originalMatrix[0][columnIndex]), 2) : perItem));
        tempMatrix.push(rowFactors);
    });

    //2.列相减
    var resultMatrix = [];
    _.each(tempMatrix, (rowArr, rowIndex) => {
        var tempRow = [];
        _.each(rowArr, (tempFactor, columnIndex) => {
            if (columnIndex == 0) return;
            var resultTempFactor = (_.isNumber(tempFactor)) ? _.round(_.subtract(tempFactor, rowArr[0]), 2) : tempFactor;
            tempRow.push(resultTempFactor);
        });
        resultMatrix.push(tempRow);
    });

    return resultMatrix;
}

/**
 * 获取所给levels各个档次的每个学科的平均分信息
 * @param  {[type]} levels           [description]
 * @param  {[type]} examStudentsInfo [description]
 * @param  {[type]} examPapersInfo   [description]
 * @param  {[type]} examFullMark     [description]
 * @return {[type]}
 *  {
 *      <levelKey>: {
 *          <pid>: <subjectMean>,
 *          ...(各个学科)
 *      },
 *      ...(各个档次)
 *  }
 */

export function newMakeSubjectLevels(levels, examStudentsInfo, examPapersInfo, examFullMark) {
    return _.map(levels, (levObj) => {
        return makeLevelSubjectMean(levObj.score, examStudentsInfo, examPapersInfo, examFullMark);
    });
}

export function makeSubjectLevels(levels, examStudentsInfo, examPapersInfo, examFullMark) {
    var result = {};
    _.each(levels, (levObj, levelKey) => {
        result[levelKey] = makeLevelSubjectMean(levObj.score, examStudentsInfo, examPapersInfo, examFullMark);
    });
    return result;
}

function makeLevelSubjectMean(levelScore, examStudentsInfo, examPapersInfo, examFullMark) {
    var result = _.filter(examStudentsInfo, (student) => _.round(student.score) == _.round(levelScore));
    var count = result.length;

    var currentLowScore, currentHighScore;
    currentLowScore = currentHighScore = _.round(levelScore);

    while ((count < 35) && (currentLowScore >= 0) && (currentHighScore <= examFullMark)) {
        currentLowScore = currentLowScore - 1;
        currentHighScore = currentHighScore + 1;
        var currentLowStudents = _.filter(examStudentsInfo, (student) => _.round(student.score) == _.round(currentLowScore));
        var currentHighStudents = _.filter(examStudentsInfo, (student) => _.round(student.score) == _.round(currentHighScore));

        var currentTargetCount = _.min([currentLowStudents.length, currentHighStudents.length]);
        var currentTagretLowStudents = _.take(currentLowStudents, currentTargetCount);
        var currentTargetHighStudents = _.take(currentHighStudents, currentTargetCount);
        count += _.multiply(2, currentTargetCount);
        result = _.concat(result, currentTagretLowStudents, currentTargetHighStudents);
    }

    return makeSubjectMean(result, examPapersInfo);
}

function makeSubjectMean(students, examPapersInfo) {
    var result = {};
    _.each(_.groupBy(_.concat(..._.map(students, (student) => student.papers)), 'paperid'), (papers, pid) => {
        var obj = {};
        obj.mean = _.round(_.mean(_.map(papers, (paper) => paper.score)), 2);
        obj.name = examPapersInfo[pid].subject; //TODO: 这里还是统一称作 'subject' 比较好
        obj.id = pid;

        result[pid] = obj;
    });
    return result;
}

export function insertRankInfo(studentObjs, rankKey='rank', groupKey='score') {
    var rankIndex = 1;
    var orderedStudentScoreInfo = _.orderBy(_.map(_.groupBy(studentObjs, groupKey), (v, k) => {
        return {
            score: parseFloat(k),
            students: v
        }
    }), ['score'], ['desc']);
    _.each(orderedStudentScoreInfo, (theObj, theRank) => {
        _.each(theObj.students, (stuObj) => {
            stuObj[rankKey] = rankIndex;
            return stuObj;
        });
        rankIndex += theObj.students.length;
    });
}

//TODO:删除
export function addRankInfo(studentObjs) {
    var rankIndex = 1;
    var orderedStudentScoreInfo = _.orderBy(_.map(_.groupBy(studentObjs, 'score'), (v, k) => {
        return {
            score: parseFloat(k),
            students: v
        }
    }), ['score'], ['desc']);
    _.each(orderedStudentScoreInfo, (theObj, theRank) => {
        _.each(theObj.students, (stuObj) => {
            stuObj.rank = rankIndex;
            return stuObj;
        });
        rankIndex += theObj.students.length;
    });
}

export function newGetLevelInfo(levels, baseStudents, examFullMark, isByScore=true) {
    var levelScoreRel = newGetLevelScoreRel(levels, baseStudents, examFullMark, isByScore);
    var targets, count, sumCount, sumPercentage, result = {}, temp = [];// levelLastIndex = _.size(levels) - 1;
    return _.map(levels, (levelObj, index) => {
        var currentLevelRel = levelScoreRel[index];
        targets = (index == 0) ? _.filter(baseStudents, (obj) => (obj.score >= currentLevelRel.currentLevelScore) && (obj.score <= currentLevelRel.highLevelScore)) : _.filter(baseStudents, (obj) => (obj.score >= currentLevelRel.currentLevelScore) && (obj.score < currentLevelRel.highLevelScore));
        count = targets.length;
        temp[index] = count;
        sumCount = _.sum(temp);
        sumPercentage = _.round(_.multiply(_.divide(sumCount, baseStudents.length), 100), 2);
        return {
            score: currentLevelRel.currentLevelScore,
            targets: targets,
            count: count,
            sumCount: sumCount,
            sumPercentage: sumPercentage
        }
    });
}

function newGetLevelScoreRel(levels, baseStudents, examFullMark, isByScore=true) {
    return _.map(levels, (levelObj, index) => {
        if(isByScore) {
            var highLevelScore = (index == 0) ? examFullMark : levels[index-1].score;
            return {
                currentLevelScore: levelObj.score,
                highLevelScore: highLevelScore
            }
        } else {
            return newGetScoreInfoByPercentage(levels, index, levelObj.sumPercentage, baseStudents, examFullMark);
        }
    });
    return result;
}

function newGetScoreInfoByPercentage(levels, index, currentPercentage, baseStudents, examFullMark) {
    var flagCount = _.ceil(_.multiply(_.divide(currentPercentage, 100), baseStudents.length));
    var targetStudent = _.takeRight(baseStudents, flagCount)[0];
    var currentLevelScore = targetStudent.score;

    if(index == 0) return { currentLevelScore: currentLevelScore, highLevelScore: examFullMark};
    var highFlagCount = _.ceil(_.multiply(_.divide(levels[index-1].sumPercentage, 100), baseStudents.length));
    var highTargetStudent = _.takeRight(baseStudents, highFlagCount)[0];
    var highLevelScore = highTargetStudent.score;
    return {
        currentLevelScore: currentLevelScore,
        highLevelScore: highLevelScore
    }
}

//TODO:这里设计的时候能不能考虑format的难易程度--遵从方便横向扫描的原则
export function getLevelInfo(levels, baseStudents, examFullMark, isByScore=true) {
    var levelScoreRel = getLevelScoreRel(levels, baseStudents, examFullMark, isByScore);
    var targets, count, sumCount, sumPercentage, result = {}, temp = {}, levelLastIndex = _.size(levels) - 1;
    _.each(levels, (levelObj, levelKey) => {
        var currentLevelRel = levelScoreRel[levelKey];
        targets = (levelKey == levelLastIndex) ? _.filter(baseStudents, (obj) => (obj.score >= currentLevelRel.currentLevelScore) && (obj.score <= currentLevelRel.highLevelScore)) : _.filter(baseStudents, (obj) => (obj.score >= currentLevelRel.currentLevelScore) && (obj.score < currentLevelRel.highLevelScore));
        count = targets.length;
        result[levelKey] = {
            targets: targets,
            count: count,
            score: currentLevelRel.currentLevelScore
        }
    });
    _.each(result, (levelObj, levelKey) => {
        temp[levelKey] = levelObj.count
    });
    _.each(temp, (count, levelKey) => {
        sumCount = (levelKey == levelLastIndex + '') ? (count) : (_.sum(_.values(_.pickBy(temp, (v, k) => k >= levelKey))));
        sumPercentage = _.round(_.multiply(_.divide(sumCount, baseStudents.length), 100), 2);
        result[levelKey].sumCount = sumCount;
        result[levelKey].percentage = sumPercentage;
    });
    return result;
}

//返回每个层级的currentLevleScore, highLevelScore
function getLevelScoreRel(levels, baseStudents, examFullMark, isByScore=true) {
    var levelLastIndex = _.size(levels) - 1;
    var result = {};
    _.each(levels, (levelObj, levelKey) => {
        if(isByScore) {
            var highLevelScore = (levelKey == levelLastIndex + '') ? examFullMark : levels[(parseInt(levelKey)+1)+''].score;
            result[levelKey] = {
                currentLevelScore: levelObj.score,
                highLevelScore: highLevelScore
            }
        } else {
            result[levelKey] = getScoreInfoByPercentage(levels, levelKey, levelObj.percentage, baseStudents, examFullMark);
        }
    });
    return result;
}

function getScoreInfoByPercentage(levels, levelKey, currentPercentage, baseStudents, examFullMark) {
    var flagCount = _.ceil(_.multiply(_.divide(currentPercentage, 100), baseStudents.length));
    var targetStudent = _.takeRight(baseStudents, flagCount)[0];
    var currentLevelScore = targetStudent.score;

    if(levelKey == (_.size(levels)-1)) return {currentLevelScore: currentLevelScore, highLevelScore: examFullMark};

    var highFlagCount = _.ceil(_.multiply(_.divide(levels[(parseInt(levelKey)+1)+''].percentage, 100), baseStudents.length));
    var highTargetStudent = _.takeRight(baseStudents, highFlagCount)[0];
    var highLevelScore = highTargetStudent.score;
    return {
        currentLevelScore: currentLevelScore,
        highLevelScore: highLevelScore
    }
}

export function newGetSubjectLevelInfo(subjectLevels, papersStudents, papersFullMark) {
    var subjectLevelRel = newGetSubjectLevelRel(subjectLevels, papersFullMark);
    var targets, count, temp;// result = {}, levelLastIndex = _.size(subjectLevels) - 1;
    return _.map(subjectLevels, (papersLevelObj, index) => {
        temp = {};
        _.each(papersLevelObj, (v, pid) => {
            var currentPaperRel = subjectLevelRel[index][pid];
            var currentPaperStudents = papersStudents[pid];
            if(!currentPaperStudents || currentPaperStudents.length == 0) {
                temp[pid] = { targets: [], count: 0};
                return;
            }
            targets = (index == 0) ? _.filter(papersStudents[pid], (obj) => (obj.score >= currentPaperRel.currentLevelPaperMean) && (obj.score <= currentPaperRel.highLevelPaperMean)) : _.filter(papersStudents[pid], (obj) => (obj.score >= currentPaperRel.currentLevelPaperMean) && (obj.score < currentPaperRel.highLevelPaperMean));
            count = targets.length;
            temp[pid] = {
                score: currentPaperRel.currentLevelPaperMean,
                targets: targets,
                count: targets.length
            }
        });
        return temp;
    });
}

function newGetSubjectLevelRel(subjectLevels, papersFullMark) {
    var result = {}, temp, highLevelPaperMean;
    return _.map(subjectLevels, (papersLevelObj, index) => {
        temp = {};
        _.each(papersLevelObj, (paperMeanObj, pid) => {
            highLevelPaperMean = (index == 0) ? papersFullMark[pid] : subjectLevels[index-1][pid].mean;
            temp[pid] = {
                currentLevelPaperMean: paperMeanObj.mean,
                highLevelPaperMean: highLevelPaperMean
            }
        });
        return temp;
    });
}

export function getSubjectLevelInfo(subjectLevels, papersStudents, papersFullMark) {
    var subjectLevelRel = getSubjectLevelRel(subjectLevels, papersFullMark);
    var targets, count, temp, result = {}, levelLastIndex = _.size(subjectLevels) - 1;
    _.each(subjectLevels, (papersLevelObj, levelKey) => {
        temp = {};
        _.each(papersLevelObj, (v, pid) => {
            var currentPaperRel = subjectLevelRel[levelKey][pid];
            var currentPaperStudents = papersStudents[pid];
            if(!currentPaperStudents || currentPaperStudents.length == 0) {
                temp[pid] = { targets: [], count: 0};
                return;
            }
            targets = (levelKey == levelLastIndex) ? _.filter(papersStudents[pid], (obj) => (obj.score >= currentPaperRel.currentLevelPaperMean) && (obj.score <= currentPaperRel.highLevelPaperMean)) : _.filter(papersStudents[pid], (obj) => (obj.score >= currentPaperRel.currentLevelPaperMean) && (obj.score < currentPaperRel.highLevelPaperMean));
            count = targets.length;
            temp[pid] = {
                targets: targets,
                count: targets.length
            }
        });
        result[levelKey] = temp;
    });
    return result;
}

function getSubjectLevelRel(subjectLevels, papersFullMark) {
    //每一个档次下每一个paperid对应的currentLevelScore和highScore
    var levelLastIndex = _.size(subjectLevels) - 1;
    var result = {}, temp, highLevelPaperMean;
    _.each(subjectLevels, (papersLevelObj, levelKey) => {
        temp = {};
        _.each(papersLevelObj, (paperMeanObj, pid) => {
            highLevelPaperMean = (levelKey == levelLastIndex + '') ? papersFullMark[pid] : subjectLevels[(parseInt(levelKey)+1)+''][pid].mean;
            temp[pid] = {
                currentLevelPaperMean: paperMeanObj.mean,
                highLevelPaperMean: highLevelPaperMean
            }
        });
        result[levelKey] = temp;
    });
    return result;
}

//根据当前reportDS数据来format baseline格式--不进行任何计算baseline的过程，只是format
export function formatNewBaseline(examId, grade, levels, subjectLevels, levelBuffers) {
    var result = {examid: examId, grade: grade, '[subjectLevels]': [], '[levelBuffers]': []};
    result['[levels]'] = _.values(levels);
    _.each(levels, (levObj, levelKey) => {
        result['[subjectLevels]'].push({levelKey: levelKey, values: subjectLevels[levelKey]});
        result['[levelBuffers]'].push({key: levelKey, score: levelBuffers[levelKey-0]});
    });
    return result;
}

//各个维度--studnetsMap的key--上每道题目的平均分
//每个群体里，每道题目的平均分
/*

{
    groupKey: [<mean>, ...]
}

 */

export function getQuestionGroupScoreMatrix(groupStudents, key='questionScores') {
    var groupQuestionsScoreMatrix = _.map(groupStudents, (studentObj) => studentObj[key]);
    var questionsGroupScoreMatrix = [];
    _.each(groupQuestionsScoreMatrix, (studentQuestonsScore, i) => {
        _.each(studentQuestonsScore, (s, j) => {
            if(!questionsGroupScoreMatrix[j]) questionsGroupScoreMatrix[j] = [];
            questionsGroupScoreMatrix[j].push(s);
        });
    });
    return questionsGroupScoreMatrix;
}

export function getGroupQuestionMean(questionsGroupScoreMatrix) {
    return _.map(questionsGroupScoreMatrix, (questionGroupScores) => _.round(_.mean(questionGroupScores), 2));
}

export function getGroupQuestionScoreRate(questions, groupQuestionMean) {
    return _.map(groupQuestionMean, (currentGroupQuestionMean, index) => _.round(_.divide(currentGroupQuestionMean, questions[index].score), 2));
}

export function getQuestionSeparation(questionGradeScoreMatrix, paperGradeScores) {
    return _.map(questionGradeScoreMatrix, (currentQuestionGradeScores, index) => _.round(StatisticalLib.sampleCorrelation(currentQuestionGradeScores, paperGradeScores), 2));
}

export function getGroupQuestionContriFactor(groupQuestionScoreRate, gradeQuestionScoreRate) {
    return _.map(groupQuestionScoreRate, (x, i) => _.round(_.subtract(x, groupQuestionScoreRate[i]), 2));
}
