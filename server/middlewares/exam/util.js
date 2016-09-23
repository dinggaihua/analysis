/*
* @Author: HellMagic
* @Date:   2016-04-30 13:32:43
* @Last Modified by:   HellMagic
* @Last Modified time: 2016-09-23 09:09:07
*/
'use strict';
var _ = require('lodash');
var when = require('when');
var client = require('request');
var moment = require('moment');
var config = require('../../config/env');
var errors = require('common-errors');

var peterHFS = require('peter').getManager('hfs');
var peterFX = require('peter').getManager('fx');
/**
 * 通过schoolid获取学校
 * @param  {[type]} schoolid [description]
 * @return {[type]}          [description]
*/
var getSchoolById = exports.getSchoolById = function(schoolid) {
    return when.promise(function(resolve, reject) {
        peterHFS.get('@School.'+schoolid, function(err, school) {
            if(err || !school) return reject(new errors.data.MongoDBError('find school:'+schoolid+' error', err));
            resolve(school);
        });
    });
};

/**
 * 获取此学校所发生过的所有exam的具体实例
 * @param  {[type]} school [description]
 * @return {[type]}        [description]
 */
exports.getExamsBySchool = function(school) {
    var examPromises = _.map(_.filter(school["[exams]"], (item) => (item.from != 40)), (obj) => examPromise(obj.id)); //既不是自定义又不是联考
    return when.all(examPromises);
}

/**
 * 根据examid--找到一个exam、根据gradeName--过滤此exam中只属于此年级的papers、根据schoolid--获取此exam相关的班级信息
 * @param  {[type]} schoolid  [description]
 * @param  {[type]} examid    [description]
 * @param  {[type]} gradeName [description]
 * @return {[type]}
    {
        [<paper>]: xxx,
        fullMark: xxx,
        {grade}: xxx,
        fetchId: xxx (fetchId是不带有一大串儿'0'的examid)
    }
 */
//TODO: 其实如果这里只是获取exam的相关信息，那么直接走DB就可以，没必要通过服务获取。
exports.generateExamInfo = function(examid, gradeName, schoolid) {

console.log('schoolid = ', schoolid);

    var data = {};
    //fetchExamById
    return getExamById(examid).then(function(exam) {
        try {
            exam['[papers]'] = _.filter(exam['[papers]'], (paper) => paper.grade == gradeName);
            exam.fullMark = _.sum(_.map(exam['[papers]'], (paper) => paper.manfen));
            data.exam = exam;
        } catch (e) {
            return when.reject(new errors.Error('generateExamInfo Error: ', e));
        }
        return getSchoolById(schoolid);
    }).then(function(school) {
        var targetGrade = _.find(school['[grades]'], (grade) => grade.name == gradeName);
        if (!targetGrade || !targetGrade['[classes]'] || targetGrade['[classes]'].length == 0) return when.reject(new errors.Error('学校没有找到对应的年级或者从属此年级的班级：【schoolid = ' +schoolid + '  schoolName = ' +school.name + '  gradeName = ' + gradeName + '】'));

        data.exam.grade = targetGrade;
        data.exam.fetchId = examid;

//获取此grade exam对应的baseline
        return getGradeExamBaseline(examid, targetGrade.name);
    }).then(function(baseline) {
        data.exam.baseline = baseline;
        return when.resolve(data.exam);
    })
};

exports.getGradeExamBaseline = getGradeExamBaseline;

function getExamById(examid) {
    return when.promise(function(resolve, reject) {
        peterHFS.get('@Exam.'+examid, function(err, exam) {
            if(err || !exam) return reject(new errors.data.MongoDBError('find exam = '+ examid + 'Error: ', err));
            resolve(exam);
        });
    });
}

/**
 * 获取examid和grade对应的gradeExam的baseline
 * @param  {[type]} examId [description]
 * @param  {[type]} grade  [description]
 * @return {[type]}        [description]
 */
function getGradeExamBaseline(examId, grade) {
    // var targetObjId = paddingObjectId(examId); 设计：都存储短id好了！
    return when.promise(function(resolve, reject) {
        var config = (grade) ? {examid: examId, grade: grade} : {examid: examId};
        peterFX.query('@ExamBaseline', config, function(err, results) {
            if(err) return reject(new errors.data.MongoDBError('getGradeExamBaseline Mongo Error: ', err));
            resolve(results[0]);
        });
    });
}

/**
 * 向exam中补充examInfo所需要的信息。生成orderedScoresArr数据结构--用来构成examStudentsInfo。生成classScoreMap数据结构，用来
 * 比对补充class相关信息。
 * @param  {[type]} exam 待需要补充信息的exam实例
 * @return {[type]}
    orderedScoresArr: 几乎和“examStudentsInfo”差不多相似的结构。
    classScoreMap: 直接从服务提供的score接口中获取目标班级的考分信息
参考：
    examInfo:
        {
            name:
            gradeName:
            startTime:
            realClasses:
            lostClasses:
            realStudentsCount:
            lostStudentsCount:
            subjects:
            fullMark:
        }
    examStudentsInfo:
        [
            {
                id:
                name:
                class:
                score:
                papers: [
                    {paperid: , score: }
                ]
            },
            ...
        ]
 */
//Note: 这里只过滤班级，因为dashboard计算的是总分，所以不能缺少科目。具体到显示科目的地方走的是学生里面的paper
exports.generateExamScoresInfo = function(exam, auth) {
    return fetchExamScoresById(exam.fetchId).then(function(scoresInfo) {
        // var authClasses = getAuthClasses(auth, exam.grade.name);
        // var targetClassesScore = {};
        // if(_.isBoolean(authClasses) && authClasses) {
        //     targetClassesScore = _.pick(scoresInfo, _.map(exam.grade['[classes]'], (classItem) => classItem.name));
        // } else if(_.isArray(authClasses) && authClasses.length > 0) {
        //     var allValidClasses = _.map(exam.grade['[classes]'], (classItem) => classItem.name);
        //     authClasses = _.filter(authClasses, (className) => _.includes(allValidClasses, className));
        //     targetClassesScore = _.pick(scoresInfo, authClasses);
        // }
        var targetClassesScore = _.pick(scoresInfo, _.map(exam.grade['[classes]'], (classItem) => classItem.name));

        var orderedStudentScoreInfo = _.sortBy(_.concat(..._.values(targetClassesScore)), 'score');
        exam.realClasses = _.keys(targetClassesScore);
        exam.lostClasses = [], exam.realStudentsCount = 0, exam.lostStudentsCount = 0;

        //Note:缺考只是针对参加了考试的班级而言，如果一个班级没有参加此场考试，那么不会认为缺考（但是此班级会被作为lostClasses）
        _.each(exam.grade['[classes]'], (classItem, index) => {
            if (targetClassesScore[classItem.name]) {
                classItem.realStudentsCount = targetClassesScore[classItem.name].length;
                exam.realStudentsCount += classItem.realStudentsCount;
                classItem.lostStudentsCount = classItem['[students]'].length - classItem.realStudentsCount;
                exam.lostStudentsCount += classItem.lostStudentsCount;
            } else {
                exam.lostClasses.push(classItem.name);
            }
        });
        exam.realClasses = _.keys(targetClassesScore);

        return when.resolve({
            baseline: exam.baseline,
            classScoreMap: targetClassesScore,
            orderedScoresArr: orderedStudentScoreInfo
        });
    });
};

/**
 * 通过examid(fetchId)查询服务获取一个exam实例
 * @param  {[type]} examid [description]
 * @return {[type]}        [description]
 */
function fetchExamById(examid) {
    var url = config.rankBaseUrl + '/exams' + '?' + 'examids=' + examid;

    return when.promise(function(resolve, reject) {
        client.get(url, {}, function(err, res, body) {
            if (err) return reject(new errors.URIError('查询rank server(exams)失败', err));
            resolve(JSON.parse(body)[examid]);
        });
    });
};

/**
 * 从DB中获取一个exam实例
 * @param  {[type]} examid [description]
 * @return {[type]}        [description]
 */
function examPromise(examid) {
    return when.promise(function(resolve, reject) {
        peterHFS.get('@Exam.' + examid, function(err, exam) {
            if(err) return reject(new errors.data.MongoDBError('find exam:'+examid+ ' error', err));
            resolve(exam);
        });
    });
}

/**
 * 根据examid通过服务接口获取exam score的信息
 * @param  {[type]} examid [description]
 * @return {[type]}        [description]
 */
function fetchExamScoresById(examid) {
    var url = config.testRankBaseUrl + '/scores' + '?' + 'examid=' + examid;
    return when.promise(function(resolve, reject) {
        client.get(url, {}, function(err, res, body) {
            if(err) return reject(new errors.URIError('查询rank server(scores)失败', err));
            var data = JSON.parse(body);
            if(data.error) return reject(new errors.Error('获取rank服务数据错误，examid='+examid));
            var keys = _.keys(data);
            resolve(data[keys[0]]);
        });
    });
}

/**
 * 根据当前用户的auth和当前所选择的grade计算所管辖的班级
 * @param  {[type]} auth     [description]
 * @param  {[type]} gradeKey [description]
 * @return {[type]} 返回true或者一个班级name的数组。
 */
function getAuthClasses(auth, gradeKey) {
//Note: 如果是schoolManager或者是此年级的年级主任或者是此年级某一学科的学科组长，那么都是给出全部此年级的班级。否则就要判断具体管理的是那些班级
    if(auth.isSchoolManager) return true;
    if(_.isBoolean(auth.gradeAuth[gradeKey]) && auth.gradeAuth[gradeKey]) return true;
    if(_.isObject(auth.gradeAuth[gradeKey]) && auth.gradeAuth[gradeKey].subjectManagers.length > 0) return true;
    var groupManagersClasses = _.map(auth.gradeAuth[gradeKey].groupManagers, (obj) => obj.group);
    var subjectTeacherClasses = _.map(auth.gradeAuth[gradeKey].subjectTeachers, (obj) => obj.group);
    return _.union(groupManagersClasses, subjectTeacherClasses);
}

//将短exam id转换成标准的Mongo ObjectId
function paddingObjectId(id) {
    id = id.toString();
    var idParts = id.split('.');
    id = idParts[idParts.length - 1];
    var oidPadding = '000000000000000000000000';
    return oidPadding.slice(0, oidPadding.length-id.length) + id;
}

