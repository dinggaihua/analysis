/*
* @Author: HellMagic
* @Date:   2016-04-30 13:32:43
* @Last Modified by:   HellMagic
* @Last Modified time: 2016-10-05 15:43:43
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

var getExamById = exports.getExamById = function(examid, fromType) {
    var url = config.analysisServer + '/exam?id=' + examid;

    return when.promise(function(resolve, reject) {
        client.get(url, {}, function(err, res, body) {
            if (err) return reject(new errors.URIError('查询analysis server(getExamById) Error: ', err));
            var data = JSON.parse(body);
            if(data.error) return reject(new errors.Error('查询analysis server(getExamById)失败, examid = ' + examid));
            data.fetchId = examid;
            if(fromType) data.from = fromType;
            resolve(data);
        });
    })
}

var getPaperById = exports.getPaperById = function(paperId) {//Warning: 不是pid，而是paperId-即mongoID
    console.time('解析paper');
    var url = config.analysisServer + '/paper?p=' + paperId;

    return when.promise(function(resolve, reject) {
        client.get(url, {}, function(err, res, body) {
            if (err) return reject(new errors.URIError('查询analysis server(getPaperById) Error: ', err));
            var temp = JSON.parse(body);
            if(temp.error) return reject(new errors.Error('查询analysis server(getPaperById)失败, paperId = ' + paperId));
            console.timeEnd('解析paper');
            resolve(temp);
        });
    })
}

var getGradeExamBaseline = exports.getGradeExamBaseline = function(examId, grade) {
    return when.promise(function(resolve, reject) {
        var config = (grade) ? {examid: examId, grade: grade} : {examid: examId};
        peterFX.query('@ExamBaseline', config, function(err, results) {
            if(err) return reject(new errors.data.MongoDBError('getGradeExamBaseline Mongo Error: ', err));
            resolve(results[0]);
        });
    });
}

exports.getValidExamsBySchoolId = function(schoolId, userId, isLianKaoManager, authGrades) {
    var ifSchoolHaveExams = false, errorInfo = {msg: ''};
    return getSchoolById(schoolId).then(function(data) {
        if(data['[exams]'] && data['[exams]'].length > 0) ifSchoolHaveExams = true;
        return filterValidExams(data['exams'], userId, schoolId, isLianKaoManager, authGrades);
    }).then(function(validExams) {
        if(!ifSchoolHaveExams) errorInfo.msg = '此学校没有考试';
        if(ifSchoolHaveExams && validExams.length == 0) errorInfo.msg = '您的权限下没有可查阅的考试';
        var examPromises = _.map(validExams, (obj) => getExamById(obj.exam, obj.from));
        return when.all(examPromises);
    }).then(function(validExamIntances) {
        return when.resolve({
            validExams: validExamIntances,
            errorInfo: errorInfo
        });
    });
}

exports.generateExamInfo = function(examId, gradeName, schoolId, isLianKao) {
    var result;
    return getExamById(examId).then(function(exam) {
        result = exam;
        result.id = examId;
        result['[papers]'] = _.filter(result['[papers]'], (paper) => paper.grade == gradeName);
        result.fullMark = _.sum(_.map(result['[papers]'], (paper) => paper.manfen));
        result.startTime = exam.event_time;
        result.gradeName = gradeName;
        result.subjects = _.map(result['[papers]'], (obj) => obj.subject);
        var resultPromises = isLianKao ? [getGradeExamBaseline(examId, gradeName)] : [getGradeExamBaseline(examId, gradeName), getValidSchoolGrade(schoolId, gradeName)];
        return when.all(resultPromises);
    }).then(function(results) {
        result.baseline = results[0];
        if(!isLianKao) result.grade = results[1];
        return when.resolve(result);
    })
}

exports.generateDashboardInfo = function(exam) {//Note:这里依然没有对auth进行判断
    var getPapersTotalInfoPromises = _.map(exam['[papers]'], (obj) => getPaperTotalInfo(obj.paper));
    return when.all(getPapersTotalInfoPromises).then(function(papers) {
        return when.resolve(generateStudentsTotalInfo(papers));
    });
}

exports.generateExamReportInfo = function(exam) {
    console.time('all');
    console.time('fetch papers');
    return getPaperInstancesByExam(exam).then(function(papers) {
        console.timeEnd('fetch papers');
        console.time('generate');
        var result = generatePaperStudentsInfo(papers);
        console.timeEnd('generate');
        console.time('other');
        result.examStudentsInfo = _.sortBy(_.values(result.examStudentsInfo), 'score');
        var examClassesInfo = generateExamClassesInfo(result.examStudentsInfo);//TODO: Warning--这里本意是获取班级的【基本信息】，但是这又依赖于school.grade.class，所以这里【暂时】使用参考信息。
        console.timeEnd('other');
        console.timeEnd('all');
        return when.resolve({
            examStudentsInfo: result.examStudentsInfo,
            examPapersInfo: result.examPapersInfo,
            examClassesInfo: examClassesInfo
        })
    });
}

exports.saveCustomExam = function(customExam) {
    var url = config.analysisServer + '/save';
    return when.promise(function(resolve, reject) {
        client.post(url, {body: customExam, json: true}, function(err, response, body) {
            if (err) return reject(new errors.URIError('查询analysis server(save exam) Error: ', err));
            var data = JSON.parse(body);
            if(data.error) return reject(new errors.Error('查询analysis server(save exam)失败'));
            resolve(body);
        });
    });
}

exports.createCustomExamInfo = function(examId, schoolId, examName, gradeName, userId) {
    return when.promise(function(resolve, reject) {
        var customExamInfo = {
            exam_id: examId,
            school_id: schoolId,
            name: examName,
            grade: gradeName,
            owner: userId,
            create_time: new Date(),
            status: 1
        };
        peterFX.create('@CustomExamInfo', customExamInfo, function(err, result) {
            if(err) return reject(new errors.data.MongoDBError('【createCustomExamInfo】Error: ', err));
            resolve(examId);
        });
    })
}

exports.delCustomExam = function(examId, schoolId) {
    return when.promise(function(resolve, reject) {
        var postBody = {
            "id" : examId,
            "school_id" : schoolId
        };
        var url = config.analysisServer + "/del";
        client.post(url, {body: postBody, json: true}, function(err, response, body) {
            if (err) return reject(new errors.URIError('查询analysis server(invalid exam) Error: ', err));
            if(!_.isEqual(body, 0)) return reject(new errors.Error('查询analysis server(invalid exam)错误'));
            resolve(body);
        });
    });
}

exports.findCustomInfo = function(examId, userId) {
    return when.promise(function(resolve, reject) {
        //先query
        //可是这些条件都是在home页都已经过滤过的（当然如果是hack user直接调用api那另说）req.body.examId是不是需要parseInt？req.user.id不需要了，应该就是int了
        peterFX.query('@CustomExamInfo', {exam_id: examId, status: 1, owner: userId}, function(err, results) {
            if(err) return reject(new errors.data.MongoDBError('查找CustomExamInfo Error : ', err));
            if(!results || results.length != 1) return reject(new errors.Error('无效的customExamInfo'));
            resolve(result[0]);
        });
    });
}

exports.inValidCustomExamInfo = function(customExamInfoId) {
    return when.promise(function(resolve, reject) {
        peterFX.set(customExamInfoId, {status: 0}, function(err, result) {
            if(err) return reject(new errors.data.MongoDBError('重置customExamInfo status Error: ', err));
            resolve(result);
        });
    });
}

function getSchoolById(schoolId) {
    var url = config.analysisServer + '/school?id=' + schoolId;
    return when.promise(function(resolve, reject) {
        client.get(url, {}, function(err, res, body) {
            if (err) return reject(new errors.URIError('查询analysis server(getExamsBySchool) Error: ', err));
            var data = JSON.parse(body);
            if(data.error) reject(new errors.URIError('查询analysis server(getExamsBySchool)失败, schoolId = ', schoolId));
            resolve(data);
        });
    });
}

function filterValidExams(originalExams, userId, schoolId, isLianKaoManager, authGrades) {
    originalExams = _.filter(originalExams, (obj) => obj['[papers]'].length > 0);//先进行基本的过滤
    var validNotCustomExams = _.filter(originalExams, (examItem) => {
        //针对非自定义的考试：如果是联考管理者，那么获取所有联考考试；如果不是联考管理者，那么获取此用户权限下的普通阅卷考试（from !='20' && from != '40'）
        return (isLianKaoManager) ? (examItem.from == '20') : ((examItem.from != '20' && examItem.from != '40') && (_.includes(authGrades, examItem.grade)));
    });
    return getCustomExamInfoByUserId(userId).then(function(userCustomExamInfos) {
        var validCustomExamIds = _.map(userCustomExamInfos, (obj) => obj['exam_id']);
        var validCustomExams = _.filter(originalExams, (obj) => {
            return (obj.from == '40' && _.includes(validCustomExamIds, obj['exam_id']));
        });
        return when.resolve(_.concat(validNotCustomExams, validCustomExams));
    });
}

function getCustomExamInfoByUserId(userId, schoolId) {
    return when.promise(function(resolve, reject) {
        peterFX.query('@CustomExamInfo', {owner: userId, status: 1, school_id: schoolId}, function(err, examInfos) {
            if(err) return reject(errors.data.MongoDBError('查询@CustomExamInfo Error(getCustomExamInfoByUserId): ', err));
            resolve(examInfos);
        });
    });
}

function getPaperTotalInfo(paperId) {
    var url = config.analysisServer + '/total?p=' + paperId;

    return when.promise(function(resolve, reject) {
        client.get(url, {}, function(err, res, body) {
            if (err) return reject(new errors.URIError('查询analysis server(getPaperTotalInfo) Error: ', err));
            var data = JSON.parse(body);
            if(data.error) return reject(new errors.Error('查询analysis server(getPaperTotalInfo)失败, paperId = ' + paperId));
            resolve(data);
        });
    });
}

function generateStudentsTotalInfo(papers) {
    var studentsTotalInfo = {}, paperStudentObj, allStudentsPaperInfo = [], temp;
    _.each(papers, (paperObj) => {
        var studentsPaperInfo = paperObj.y;
        temp = {};
        temp.subject = paperObj.x[0].name;
        temp.manfen = paperObj.x[0].score;
        temp.students = studentsPaperInfo;
        allStudentsPaperInfo.push(temp);
        _.each(studentsPaperInfo, (studentObj) => {
            paperStudentObj = studentsTotalInfo[studentObj.id];
            if(!paperStudentObj) {
                paperStudentObj = _.pick(studentObj, ['id', 'name', 'class', 'school']);
                paperStudentObj.score = 0;
                studentsTotalInfo[studentObj.id] = paperStudentObj;
            }
            paperStudentObj.score = paperStudentObj.score + studentObj.score;
        });
    });
    studentsTotalInfo = _.sortBy(_.values(studentsTotalInfo), 'score');
    return {
        studentsTotalInfo: studentsTotalInfo,
        allStudentsPaperInfo: allStudentsPaperInfo
    };
}

//TODO: 这里最好还是通过analysis server来返回学校的基本信息（添加grade等需要的字段），这样就完全避免查询数据库.
function getValidSchoolGrade(schoolId, gradeName) {
    return when.promise(function(resolve, reject) {
        peterHFS.get('@School.'+schoolId, function(err, school) {
            if(err || !school) {
                console.log('不存在此学校，请确认：schoolId = ', schoolId);
                return reject(new errors.data.MongoDBError('find school:'+schoolId+' error', err));
            }
            var targetGrade = _.find(school['[grades]'], (grade) => grade.name == gradeName);
            if (!targetGrade || !targetGrade['[classes]'] || targetGrade['[classes]'].length == 0) {
                console.log('此学校没有对应的年假或从属此年级的班级：【schoolId = ' + schoolId + '  schoolName = ' + school.name + '  gradeName = ' + gradeName + '】');
                return when.reject(new errors.Error('学校没有找到对应的年级或者从属此年级的班级：【schoolId = ' +schoolId + '  schoolName = ' +school.name + '  gradeName = ' + gradeName + '】'));
            }
            resolve(targetGrade);
        });
    });
}

function getPaperInstancesByExam(exam) {
    var getPaperInstancePromises = _.map(exam['[papers]'], (obj) => getPaperById(obj.paper));
    return when.all(getPaperInstancePromises);
}

function generatePaperStudentsInfo(papers) {
    var examPapersInfo = {}, examStudentsInfo = {};
    _.each(papers, (paperObj) => {
        examPapersInfo[paperObj.id] = formatPaperInstance(paperObj);
        var students = paperObj['[students]'], matrix = paperObj.matrix, paperStudentObj, answers = paperObj.answers;
        _.each(students, (studentObj, index) => {
            paperStudentObj = examStudentsInfo[studentObj.id];
            if(!paperStudentObj) {
                paperStudentObj = _.pick(studentObj, ['id', 'name', 'class', 'school']);
                paperStudentObj.papers = [], paperStudentObj.questionScores = [], paperStudentObj.score = 0;
                examStudentsInfo[studentObj.id] = paperStudentObj;
            }
            paperStudentObj.score = paperStudentObj.score + studentObj.score;
            paperStudentObj.papers.push({id: studentObj.id, paperid: paperObj.id, score: studentObj.score, 'class_name': studentObj.class});
            paperStudentObj.questionScores.push({paperid: paperObj.id, scores: matrix[index], answers: answers[index]});
        });
    });
    return {
        examPapersInfo: examPapersInfo,
        examStudentsInfo: examStudentsInfo
    }
}

function formatPaperInstance(paperObj) {
    var result = _.pick(paperObj, ['id', 'subject', 'grade']);
    result.paper = paperObj._id;
    result.fullMark = paperObj.manfen;
    result.questions = paperObj['[questions]'];
    var paperStudents = paperObj['[students]'];
    var paperStudentsByClass = _.groupBy(paperStudents, 'class');

    result.realClasses = _.keys(paperStudentsByClass);
    result.realStudentsCount = paperStudents.length;

    var paperClassCountInfo = {};
    _.each(paperStudentsByClass, (pcStudents, className) => {
        paperClassCountInfo[className] = pcStudents.length;
    });
    result.classes = paperClassCountInfo;
    return result;
}

function generateExamClassesInfo(examStudentsInfo) {
    var result = {}, studentsByClass = _.groupBy(examStudentsInfo, 'class');
    _.each(studentsByClass, (classStudents, className) => {
        var classStudentIds = _.map(classStudents, (obj) => obj.id);//TODO: 不确定之前DB中的school.grade.class.students里的String是kaohao, xuehao还是id。这里先存储为student.id
        result[className] = {
            name: className,
            students: classStudentIds,
            realStudentsCount: classStudentIds.length
        }
    });
    return result;
}
