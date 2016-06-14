/*
* @Author: HellMagic
* @Date:   2016-04-30 11:19:07
* @Last Modified by:   HellMagic
* @Last Modified time: 2016-06-14 14:46:06
*/

'use strict';

var peterHFS = require('peter').getManager('hfs');
var peterFX = require('peter').getManager('fx');

var when = require('when');
var _ = require('lodash');
var errors = require('common-errors');
var examUitls = require('./util');
var moment = require('moment');


/**
 * 根据当前登录的用户获取其所在学校所产生的考试
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 *
 * Note：但是由于当前exam中没有对年级区分--即，会出现不同的年级的paper会出现在同一个exam中，而对于不同年级之间进行比较是没有意义的--
 * 因此需要对exam中papers进行年级的区分，当做不同的exam对待
 */
/*
Home View的服务端输出数据结构：
exam实例的数组：
[
    <exam schema>
]
*/
exports.home = function(req, res, next) {
    //0.通过verify已经有了req.user
    //1.获取此用户所从属的学校信息
    examUitls.getSchoolById(req.user.schoolId).then(function(school) {
        //2.获取此学校所产生的所有的考试信息--因为不牵涉到分数，所以这里直接读DB即可，不需要rank-server的exam api
        return examUitls.getExamsBySchool(school);
    }).then(function(exams) {
        res.status(200).json(exams);
    }).catch(function(err) {
        next(err);
    })
}


//TODO:转移到exam.util中
/**
 * 对获取exam API的参数进行校验：examid 和 grade
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
/*
因为当前exam中没有区分年级，所以要传递examid和grade来确定到底是由哪些papers构成的一个exam
 */
exports.validateExam = function(req, res, next) {
    req.checkQuery('examid', '无效的examids').notEmpty();
    req.checkQuery('grade', '无效的grade').notEmpty();
    if(req.validationErrors()) return next(req.validationErrors());
    if(req.query.examid.split(',').length > 1) return next(new errors.ArgumentError('只能接收一个examid', err));

    next();
}

//TODO:在这里完成首页所需的信息：重点是分类好所有exam相关的信息：
//数据来源rank-server的http://ct.yunxiao.com:8156/exams?examids=167,168,...去获取当前学校所有发生考试的exam
/*
{
    name:
    event_time:
    grade:
    fullMark:
    realClasses:
    lostClasses:
    realStudentsCount:
    lostStudentsCount:
}
*/
exports.initExam = function(req, res, next) {
    var grade = decodeURI(req.query.grade);
    examUitls.generateExamInfo(req.user.schoolId, req.query.examid, grade).then(function(exam) {
        req.exam = exam;
        return examUitls.generateExamScoresInfo(req.exam);
    }).then(function(result) {
        req = _.assign(req, result);
        next();
    }).catch(function(err) {
        next(err);
    });
}



/**
 * 返回dashboard数据结构的结果
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
exports.dashboard = function(req, res, next) {
    var exam = req.exam, examScoreMap = req.classScoreMap, examScoreArr = req.orderedScoresArr;

    try {
        var examInfoGuideResult = examInfoGuide(exam);
        var scoreRankResult = scoreRank(examScoreArr);
        var levelScoreReportResult = levelScoreReport(exam, examScoreArr);
        var classScoreReportResult = classScoreReport(examScoreArr, examScoreMap);

        res.status(200).json({
            examInfoGuide: examInfoGuideResult,
            scoreRank: scoreRankResult,
            levelScoreReport: levelScoreReportResult,
            classScoreReport: classScoreReportResult
        });
    } catch(e) {
        next(new errors.Error('format dashboard error : ', e));
    }

    // getStudentSelfReport(examScoreArr, examScoreMap).then(function(studentSelfReportResult) {

    // }).catch(function(err) {
    //     next(err);
    // });
    // var studentSelfReportResult = studentSelfReport(examScoreArr);
}

exports.customDashboard = function(req, res, next) {
    req.checkQuery('examid', '无效的examids').notEmpty();
    if(req.validationErrors()) return next(req.validationErrors());

    peterFX.get(req.query.examid, function(err, exam) {  //{isValid: true}
        //1.注意字段名和之前数据结构中不一样（如果它是个数组）
        //2.有些是Map，但从DB中拿出来是数组
        if(err) return next(new errors.data.MongoDBError('get custom exam error: ', err));
        if(!exam) return next(new errors.data.MongoDBError('not found valid exam'));
        try {
            var customExamInfoGuideResult = customExamInfoGuide(exam.info);
            // console.log('==========  1');
            var customScoreRankResult = customScoreRank(exam);
            // console.log('============= 2');
            var customLevelScoreReportResult = customLevelScoreReport(exam);
            // console.log('================== 3');
            var customClassScoreReportResult = customClassScoreReport(exam);
            // console.log('=================== 4');
// res.status(200).send('ok');

            res.status(200).json({
                examInfoGuide: customExamInfoGuideResult,
                scoreRank: customScoreRankResult,
                levelScoreReport: customLevelScoreReportResult,
                classScoreReport: customClassScoreReportResult
            })
        } catch(e) {
            next(new errors.Error('format custom dashboard error: ', e));
        }
    })

    // res.status(200).send('ok');
}

function customExamInfoGuide(examInfo) {
    return {
        name: examInfo.name,
        subjectCount: examInfo['[subjects]'].length,
        realClassesCount: examInfo['[realClasses]'].length,
        realStudentsCount: examInfo.realStudentsCount,
        lostStudentsCount: examInfo.lostStudentsCount
    }
}


function examInfoGuide(exam) {
    return {
        name: exam.name,
        subjectCount: exam['[papers]'].length,
        realClassesCount: exam.realClasses.length,
        realStudentsCount: exam.realStudentsCount,
        lostStudentsCount: exam.lostStudentsCount
    };
}

function scoreRank(examScoreArr) {
    //Top的排名
    return {
        top: _.reverse(_.takeRight(examScoreArr, 6)),
        low: _.reverse(_.take(examScoreArr, 6))
    }
}

function customScoreRank(exam) {
    var examStudentsInfo = exam['[studentsInfo]'];
    return {
        top: _.reverse(_.takeRight(examStudentsInfo, 6)),
        low: _.reverse(_.take(examStudentsInfo, 6))
    }
}

//这个也是走默认level的设定：即，三挡，每一档有默认的上线率，然后反求对应的此档线的分数，统计人数
function levelScoreReport(exam, examScoreArr) {
    var levels = {
        0: {
            score: 0,
            count: 0,
            percentage: 15
        },
        1: {
            score: 0,
            count: 0,
            percentage: 25
        },
        2: {
            score: 0,
            count: 0,
            percentage: 60
        }
    };

    var totalStudentCount = exam.realStudentsCount;
    _.each(levels, (levObj, levelKey) => {
        levObj.count = _.ceil(_.multiply(_.divide(levObj.percentage, 100), totalStudentCount));
        var targetStudent = _.takeRight(examScoreArr, levObj.count)[0];
        levObj.score = targetStudent ? targetStudent.score : 0;
    });
    return levels;
}

function customLevelScoreReport(exam) {
    var levels = {
        0: {
            score: 0,
            count: 0,
            percentage: 15
        },
        1: {
            score: 0,
            count: 0,
            percentage: 25
        },
        2: {
            score: 0,
            count: 0,
            percentage: 60
        }
    };
    var totalStudentCount = exam.info.realStudentsCount;
    var examStudentsInfo = exam['[studentsInfo]'];
    _.each(levels, (levObj, levelKey) => {
        levObj.count = _.ceil(_.multiply(_.divide(levObj.percentage, 100), totalStudentCount));
        var targetStudent = _.takeRight(examStudentsInfo, levObj.count)[0];
        levObj.score =  targetStudent ? targetStudent.score : 0;
    });
    return levels;
}

function classScoreReport(examScoreArr, examScoreMap) {
    //年级平均分
    var scoreMean = _.round(_.mean(_.map(examScoreArr, (scoreObj) => scoreObj.score)), 2);
    var classesMean = _.map(examScoreMap, (classesScore, className) => {
        return {
            name: className,
            mean: _.round(_.mean(_.map(classesScore, (scoreObj) => scoreObj.score)), 2)
        }
    });
    var orderedClassesMean = _.sortBy(classesMean, 'mean');
    return {
        gradeMean: scoreMean,
        top5ClassesMean: _.reverse(_.takeRight(orderedClassesMean, 5))
    };
}

function customClassScoreReport(exam) {
    var examStudentsInfo = exam['[studentsInfo]'];
    var studentsGroupByClass = _.groupBy(examStudentsInfo, 'class');

    var scoreMean = _.round(_.mean(_.map(examStudentsInfo, (student) => student.score)), 2);
    var classesMean = _.map(studentsGroupByClass, (classesStudents, className) => {
        return {
            name: className,
            mean: _.round(_.mean(_.map(classesStudents, (student) => student.score)), 2)
        }
    });
    var orderedClassesMean = _.sortBy(classesMean, 'mean');
    return {
        gradeMean: scoreMean,
        top5ClassesMean: _.reverse(_.takeRight(orderedClassesMean, 5))
    };
}

/**
 * 怎么定义的？？？本来想是req.user--但是不对，应为当前登录应该为教师等级的。。。
 * @return {[type]} [description]
 */
// TODO: 暂时注释
// function getStudentSelfReport(examScoreArr, examScoreMap) {
//     // return { todo: '待定'};
//     // 所有学生：
//         //[{name: , score: scoolRanking: , classRanking: , subject: }, <name>]
//     var top20Students = _.reverse(_.takeRight(examScoreArr, 20));
//     var topStudent = top20Students[0];
//     var restStudents = _.slice(top20Students, 1);
//     return getStudentInfo(topStudent.id).then(function(student) {
//         //TODO: 在这里拼接第一个学生的相关数据
//     })
// }


// function getStudentInfo(studentId) {
//     return when.promise(function(resolve, reject) {
//         peterHFS.get('@Student' + studentId, function(err, student) {
//             if(err) return reject(new errors.MongoDBError('find single student error : ', err));
//             resolve(student);
//         });
//     });
// }




exports.schoolAnalysis = function(req, res, next) {
    var exam = req.exam, examScoreMap = req.classScoreMap, examScoreArr = req.orderedScoresArr;
    try {
        req.examInfo = formatExamInfo(exam);
        req.examPapersInfo = generateExamPapersInfo(exam);
        req.examClassesInfo = genearteExamClassInfo(exam);
    } catch (e) {
        next(new errors.Error('schoolAnalysis 同步错误', e));
    }
    generateExamStudentsInfo(exam, examScoreArr, req.examClassesInfo).then(function(examStudentsInfo) {
        res.status(200).json({examInfo: req.examInfo, examPapersInfo: req.examPapersInfo, examClassesInfo: req.examClassesInfo, examStudentsInfo: examStudentsInfo});
    }).catch(function(err) {
        next(new errors.Error('schoolAnalysis Error', err));
    });
}

exports.customSchoolAnalysis = function(req, res, next) {
    console.log('customSchoolAnalysis');
    res.status(200).send('ok');
}

exports.createCustomAnalysis = function(req, res, next) {
console.log('createCustomAnalysis  1');

    // req.checkBody('data', '无效的data').notEmpty();
    // if(req.validationErrors()) return next(req.validationErrors());
    if(!req.body.data) return next(new errors.HttpStatusError(400, "没有data属性数据"));

console.log('createCustomAnalysis  2');

    peterFX.create('@Exam', req.body.data, function(err, result) {
        if(err) return next(new errors.data.MongoDBError('创建自定义分析错误', err));
console.log('createCustomAnalysis  3');
        res.status(200).json({examId: result});
    });
}

// exports.deleteCustomAnalysis = function(req, res, next) {
//     req.checkBody('examId', '删除自定义分析错误，无效的examId').notEmpty();
//     if(req.validationErrors()) return next(req.validationErrors());

//     peterFX.destroy(req.body.examId, function(err, result) {
//         if(err) return next(new errors.data.MongoDBError('删除自定义分析错误', err));
//         console.log('删除的result = ', result);
//         res.status(200).send('ok');
//     })
// }

exports.inValidCustomAnalysis = function(req, res, next) {
    req.checkBody('examId', '删除自定义分析错误，无效的examId').notEmpty();
    if(req.validationErrors()) return next(req.validationErrors());

    peterFX.set(req.body.examId, {isValid: false}, function(err, result) {
        if(err) return next(new errors.data.MongoDBError('更新自定义分析错误', err));
        res.status(200).send('ok');
    })
}


function formatExamInfo(exam) {
    var examInfo = _.pick(exam, ['name', 'realStudentsCount', 'lostStudentsCount', 'realClasses', 'lostClasses', 'fullMark']);
    examInfo.gradeName = exam.grade.name;
    examInfo.startTime = moment(exam['event_time']).valueOf();
    examInfo.subjects = _.map(exam['[papers]'], (paper) => paper.subject);
    return examInfo;
}

function generateExamStudentsInfo(exam, examScoreArr, examClassesInfo) {
    //在examScoreArr的每个对象中添加papers属性信息: 一个数组，里面就是{id: <pid>, score: <分数>}
    //req.exam['[papers]'] item.paper
    return generateStudentsPaperInfo(exam, examClassesInfo).then(function(studentsPaperInfo) {
        //遍历examScoreArr是为了保证有序
        _.each(examScoreArr, (scoreObj) => {
            scoreObj.papers = studentsPaperInfo[scoreObj.id];//注意，这里id是短id...
        });
        return when.resolve(examScoreArr);
    });
}

//如果某些班级没有参加某场paper，那么此班级里的所有学生的papers属性就会缺少对应的pid对象
/*
studentsPaperInfo:
{
    <student._id>: [
        {
           paperid:
           score:
        },
        ...
    ]
}

 */
function generateStudentsPaperInfo(exam, examClassesInfo) {
    //拿到所有exam['[papers]']的paper实例
    var studentsPaperInfo = {};
    var targetPaperIds = _.map(exam['[papers]'], (paperItem) => paperItem.id);
    //对每一个paper实例建立<studentId>:<paperScore>的Map。或者也可以通过查询Student实例来得到每个学生的papers信息，但是那样的话查询的压力就大了许多，但是
    //studnet.id上有索引。。。这个时间对比就不好评估了，先使用查询看看性能如何。。。
    //方法一：直接使用@Student表中已经计算好的各科的成绩，但需要过滤属于此场考试的papers才是有效的papers。使用$in操作符，或者getMany，不知道那个性能好一些
//

    var studentIds = _.map(_.concat(..._.map(exam.realClasses, (className) => examClassesInfo[className].students)), (sid) => '@Student.' + sid); //当前年级的所有参考班级的所有学生（可能会包含缺考学生，但是这样的学生其papers的length就是0了，所以也没有问题）
    return when.promise(function(resolve, reject) {
        peterHFS.getMany(studentIds, {project: ['_id', '[papers]']}, function(err, students) {
            if(err) return reject(new errors.data.MongoDBError('query students error : ', err));
            //过滤student['papers']，建立Map
            try {
                _.each(students, (studentItem) => {
                    var targetPapers = _.filter(studentItem['[papers]'], (paperItem) => _.includes(targetPaperIds, paperItem.paperid));
                    targetPapers = _.map(targetPapers, (paperItem) => _.pick(paperItem, ['paperid', 'score', 'class_name']));
                    var studentId = studentItem._id.toString();
                    studentId = studentId.slice(_.findIndex(studentId, (c) => c!== '0'));
                    studentsPaperInfo[studentId] = targetPapers;
                });
                resolve(studentsPaperInfo);
            } catch(e) {
                reject(new errors.Error('generateStudentsPaperInfo error : ', e));
            }
        });
    });
}

function generateExamPapersInfo(exam) {
    var examPapersInfo = {};
    _.each(exam['[papers]'], (paperItem) => {
        var obj = _.pick(paperItem, ['id', 'paper', 'subject']);
        obj.fullMark = paperItem.manfen;
        obj.realClasses = _.keys(paperItem.scores);
        var gradeClassNames = _.map(exam.grade['[classes]'], (classItem) => classItem.name);
        obj.lostClasses = _.difference(gradeClassNames, obj.realClasses);
        obj.realStudentsCount = _.sum(_.map(paperItem.scores, (classScores, className) => classScores.length));
        var totalClassStudentCount = _.sum(_.map(_.filter(exam.grade['[classes]'], (classItem) => _.includes(obj.realClasses, classItem.name)), (classObj) => classObj['[students]'].length));
        obj.lostStudentsCount = totalClassStudentCount - obj.realStudentsCount;
        var paperClass = {};
        _.each(paperItem.scores, (classScores, className) => {
            paperClass[className] = classScores.length;
        });
        obj.classes = paperClass;
        examPapersInfo[paperItem.id] = obj;//这里选用id而不是paper是因为studentInfo中paper的成绩的id是paper.id而不是objectId
    });

    return examPapersInfo;
}


function genearteExamClassInfo(exam) {
    var examClassesInfo = {};
    _.each(exam.grade['[classes]'], (classItem) => {
        var obj = _.pick(classItem, ['realStudentsCount', 'lostStudentsCount']);
        obj.students = classItem['[students]'];
        obj.name = classItem.name;
        examClassesInfo[classItem.name] = obj;
    });
    return examClassesInfo;
}

//方法二：
// return getPapersInfo(exam).then(function(papers) {
//     // '[students]'  matrix 使用这个去拼凑每个学生各科成绩

// })
//顺带生成examPapersInfo

// function getPapersInfo(exam) {
//     var papersPromise = _.map(exam['[papers]'], (paperDoc) => {
//         return getPaperPromise(paperDoc.paper);
//     });
//     return when.all(papersPromise);
// }

// function getPaperPromise(paperId) {
//     return when.promise(function(resolve, reject) {
//         peterHFS.get(paperId, function(err, paper) {
//             if(err) return reject(new errors.Data.MongDBError('find paper: ' + paperId + '  Error', err));
//             resolve(paper);
//         });
//     });
// }




//返回排好序的，学生考试信息。主要是对orderedScoresArr中的每一个对象添加papers属性
//考虑是否是需要同时生成examPapersInfo和examClassesInfo以及examInfo
// function generateDataExamInfo(exam) {
//     //examInfo

// }



// /**
//  * 建立后面所需要的各种元数据（来自DB）
//  * @param  {[type]}   req  [description]
//  * @param  {[type]}   res  [description]
//  * @param  {Function} next [description]
//  * @return {[type]}        [description]
//  */
// exports.initExam = function(req, res, next) {
//     res.result = {};
//     examUitls.getExamById(req.query.examid).then(function(exam) {
//         req.exam = exam;
//         return examUitls.getAllPapersByExam(exam);
//     }).then(function(papers) {
//         req.papers = papers;
//         return examUitls.getSchoolById(req.exam.schoolId);
//     }).then(function(school) {
//         req.school = school;
//         next();
//     }).catch(function(err) {
//         next(err);
//     })
// }

// exports.initExamTotalScore = function(req, res, next) {
// // console.log('initExamTotalScore ....');
// //要所有学生的top6，那么可以只取每一个班级的top6，这样从这些top6中获取总的top6
//     return examUitls.getScoresByExamid(req.query.examid).then(function(allTotalScoreGroupByClssName) {
//         try {
//             var result = scoreFilter(allTotalScoreGroupByClssName);
//             req.scoreRank = result.scoreRank;
//             req.levelReport = result.levelReport;
//             next();
//         } catch(e) {
//             return when.reject(new errors.Error('initExamTotalScore Format Error', e));
//         }
//     }).catch(function(err) {
//         next(err);
//     })
// }

// function scoreFilter(totalScoreGroup) {
//     var orderedScores = _.chain(totalScoreGroup)
//         .map((scores) => _.take(scores, 6))
//         .value()
//     ;
//     orderedScores = _.orderBy(_.concat(...orderedScores), ['score'], ['desc']);

//     var scoreRank = {
//         top: _.take(orderedScores, 6),
//         low: _.takeRight(orderedScores, 6)
//     };

//     var totalCount = orderedScores.length;
//     var firstValues = _.filter(orderedScores, (obj) => obj.score>600);
//     var secondValues = _.filter(orderedScores, (obj) => obj.score>520);
//     var thirdValues = _.filter(orderedScores, (obj) => obj.score>480);

//     var levelReport = {
//         'first': {flag: 600, percentage:_.round(_.multiply(_.divide(firstValues.length, totalCount), 100), 1), count: firstValues.length},
//         'second': {flag: 520, percentage: _.round(_.multiply(_.divide(secondValues.length, totalCount), 100), 1), count: secondValues.length},
//         'third': {flag: 480, percentage: _.round(_.multiply(_.divide(thirdValues.length, totalCount), 100), 1), count: thirdValues.length}
//     };

//     return {
//         scoreRank: scoreRank,
//         levelReport: levelReport
//     }
// }



/**
 * 返回SchoolAnalysis的基本数据结构。不同于Home和Dashboard，因为schoolAnalysis有许多交互改变条件从而改变展示数据的场景，所以
 * 没有直接返回格式化程度高的数据格式
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */





/**
 * 对所给学校所发生的所有exam进行分组排序
 * @param  {[type]} exams  此学校所发生过的所有exam
 * @return {[type]}        按照exam发生时间分组并且排序好的，组内部按照exam发生时间进行排序好的数组
 * @InterFaceFormat        [{timeKey: [{examName: xxx, eventTime: xxx, subjectCount: xx, fullMark: xxx, from: xxx}]}]，其中time字段只是为了排序用的
 */


//两个获得的数据一样！！！
exports.testLevel = function(req, res, next) {
    var result = [];
    examUitls.getScoresById(req.query.examid)
        .then(function(scores) {
            _.each(scores, function(value, className) {
                result = _.concat(result, value);
            });

            var levelScore = _.groupBy(result, function(score, index) {
                if(score >= 600) return 'first';
                if(score >= 520) return 'second';
                if(score >= 400) return 'third';
                return 'other';
            });
            res.result.testlevel = {};
            _.each(levelScore, function(value, key) {
                res.result.testlevel[key] = value.length;
            });
            next();
        }).catch(function(err) {
            next(err);
        })
}



/**
 * 获取当前用户所从属学校的信息--拿到此学校所发生的所有exam实例id，从而到@Exam中获取实例req.exams
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
// exports.initSchool = function(req, res, next) {
//     examUitls.getSchoolById(req.user.schoolId)
//         .then(function(school) {
//             req.school = school;
//             return examUitls.getExamsBySchool(req.school);
//         }).then(function(exams) {
//             req.exams = exams;
//             next();
//         }).catch(function(err) {
//             next(err);
//         })
//     ;
// }


/*

DST1:
[
    {
        'a1': {name: 'hellmagic', score: 40, class: 'A2' },
        totalScore: 40,
        '123': {name: '语文', score: 50 }
    },
    {
        'a2': {name: 'liucong', score: 70, class: 'A1' },
        totalScore: 40,
        '456': {name: '数学', score: 56 }
    },
    {
        'a3': {name: 'liujuan', score: 40, class: 'A1' },
        totalScore: 40,
        '789': {name: '语文', score: 70 }
    },
    {
        'a4': {name: 'wangrui', score: 80, class: 'A2' },
        totalScore: 40,
        '789': {name: '数学', score: 35 },
    },
    {
        'a3': {name: '哈哈', score: 1000, class: 'A2' },
        totalScore: 40,
        '789': 70,
        '456': 60,
        '098': 80,
    }
]

DST2：
{
    <paperId> : {name: '', fullMark: 100}
}

DST3:
About Class
{
    'A1': {studentsCount: 100},
    'A2': {studentsCount: 120}
}




 */

/*
总分趋势：
    当前有所有学生的





 */



//     req.checkQuery('examid', '无效的examids').notEmpty();
//     if(req.validationErrors()) return next(req.validationErrors());

//     //因为本身就是对一场考试的分析，所以就只接收一个examid（本身rank-server接收多个examid，所以是examids）
//     if(req.query.examid.split(',').length > 1) return next(new errors.ArgumentError('只能接收一个examid', err))

//     var url = config.rankBaseUrl + examPath + '?' + 'examids=' + req.query.examid;
//     var result = {
//         subjectCount: 0,
//         totalProblemCount: 0,
//         classCount: 0,
//         totalStudentCount: 0
//     };
//     //因为支持一次查询多场exam，所以req.query,examids是复数--多个examid通过逗号隔开，返回的结果是个Map，其中key是examid，value是exam
//     //实体。
//     when.promise(function(resolve, reject) {
//         client.get(url, {}, function(err, res, body) {
//             if(err) return reject(new errors.URIError('查询rank server失败', err));
//             resolve(JSON.parse(body)[req.query.examid]);
//         })
//     }).then(function(data) {
//         //data是一个以examid为key，exam实例为vlaue的Map
//         // console.log('data.name = ', data.name);
//         result.subjectCount = data["[papers]"] ? data["[papers]"].length : 0;

// console.log('data["[papers]"].length = ', data["[papers]"].length);

//         var findPapersPromises = _.map(data["[papers]"], function(pobj) {
//             return when.promise(function(resolve, reject) {

// console.log('paper = ', pobj.paper);

//                 peterHFS.get(pobj.paper, function(err, paper) {
//                     if(err) return reject(new errors.data.MongoDBError('find paper:'+pid+' error', err));
//                     resolve(paper);
//                 });
//             });
//         });
//         return when.all(findPapersPromises);
//     }).then(function(papers) {

//         res.status(200).send('ok');
//     })
//     .catch(function(err) {
//         next(err);
//     });
    // var result = {
    //     totalProblemCount: 0,
    //     totalStudentCount: 0
    // };
    // result.subjectCount = req.exam.papers ? req.exam.papers.length : 0;
    // var findPapersPromises = _.map(req.exam.papers, function(pid) {
    //     return when.promise(function(resolve, reject) {
    //         peterHFS.find(pid, function(err, paper) {
    //             if(err) return reject(new errors.data.MongoDBError('find paper:'+pid+' error', err));
    //             resolve(paper);
    //         });
    //     });
    // });
    // //这里有遍历查找
    // when.all(findPapersPromises).then(function(papers) {
    //     var examStduentIds = [];
    //     _.each(papers, function(paper) {
    //         result.totalProblemCount += (paper.questions ? paper.questions.length : 0);
    //         //总学生数目：参加各个考试的学生的并集 （缺考人数：班级里所有学生人数-参加此场考试的学生人数）
    //         // result.totalStudentCount += (paper.students ? paper.students.length || 0);
    //         var paperStudentIds = _.map(paper.students, function(student) {
    //             return student._id;
    //         });
    //         examStduentIds = _.union(examStduentIds, paperStudentIds);
    //     });
    //     result.totalStudentCount = examStduentIds.length; //这里拿到了参加此场考试(exam)的所有学生id
    //     return examUitls.getExamClass();
    // }).then(function(classCount) {
    //     result.classCount = classCount;
    //     res.status(200).json(result);
    // })
    // .catch(function(err) {
    //     next(err);
    // });

