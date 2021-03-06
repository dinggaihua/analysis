import React from 'react';
import _ from 'lodash';
import commonClass from '../../../../common/common.css';
import {COLORS_MAP as colorsMap} from '../../../../lib/constants';
import StudentPerformanceModule from './studentPerformance';
var tabletdStyle = {width:'120px',textAlign:'left'};
var tablethStyle = {lineHeight:'40px',verticalAlign:'left'};

const Table = ({tableData,isGood}) => {
    return (
        <table  style={_.assign({}, { width: '521px',  margin: '30px auto',fontSize:'12px',color:'#333'}) }>
            <thead>
                <tr style={{fontSize:'14px'}}>
                    <th style={{width:100,textAlign:'left'}}>名次</th>
                    <th style={{width:120,textAlign:'left'}}>姓名</th>
                    <th style={{width:120,textAlign:'left'}}>总分</th>
                    <th style={{width:180,textAlign:'left'}}>学校</th>
                </tr>
            </thead>
            <tbody>
                {
                    tableData.map((student, index) => {
                        {
                            var localStyle = {};
                            if(isGood){
                            switch (student.rank) {
                                case 1:
                                    localStyle = {width:'22px',height:'22px',borderRadius:'50%',lineHeight:'22px', backgroundColor:'#ee6b52',color:'#fff',paddingLeft:'7px'}; break;

                                case 2:

                                        localStyle = {width:'22px',height:'22px',borderRadius:'50%',lineHeight:'22px', backgroundColor:'#f6953d',color:'#fff',paddingLeft:'7px'}; break;

                                case 3:

                                        localStyle = {width:'22px',height:'22px',borderRadius:'50%',lineHeight:'22px', backgroundColor:'#f7be38',color:'#fff',paddingLeft:'7px'}; break;

                                default:
                                    localStyle = {width:'22px',height:'22px',borderRadius:'50%',lineHeight:'22px', backgroundColor:'#f2f2f2',color:'#999',paddingLeft:'7px'}
                            }

                        }
                        else{
                    localStyle = {width:'22px',height:'22px',borderRadius:'50%',lineHeight:'22px', backgroundColor:'#f2f2f2',color:'#999',paddingLeft:'7px'}
                }}
                        return (
                            <tr key={index} style={tablethStyle}>
                                <td style={{width:100,textAlign:'left'}}>
                                    <div style={localStyle}>{student.rank?student.rank:''}</div>
                                </td>
                                <td style={{width:120,textAlign:'left',height:40,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',display:'block'}} title={student.name}>{student.name?student.name:''}</td>

                                <td style={{width:120,textAlign:'left'}}>{student.score?student.score:''}</td>
                                <td style={{width:180,textAlign:'left',height:40,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',display:'block'}}  title={student.school}>{student.school?student.school:''}</td>
                            </tr>
                        )
                    })
                }
            </tbody>
        </table>
    )
}
export default function ImportStudentsModule({reportDS}) {
    var examStudentsInfo = reportDS.examStudentsInfo.toJS();
    var headers = reportDS.headers.toJS();
    var topStudentsInfo = getTopStudentsInfo(examStudentsInfo);
    var lowStudentsInfo = getLowStudentsInfo(examStudentsInfo);
    debugger
    return (
        <div id='importantStudents' className={commonClass['section']}>
            <span className={commonClass['title-bar']}></span>
            <span className={commonClass['title']}>重点学生信息</span>
            <span className={commonClass['title-desc']}></span>
            <div>
                <div style={{width: 553, height: '100%', border: '1px solid' + colorsMap.C05, borderRadius: 2,paddingLeft:30,marginTop:30,marginRight:30,float:'left'}}>
                    <div style={{padding:'30px 0 30px 0',width:'100%',borderBottom:'1px solid' + colorsMap.C05}}>本次考试前十名的学生</div>
                    <Table tableData={topStudentsInfo} isGood={true}/>
                </div>
                <div style={{width: 553, height: '100%', border: '1px solid' + colorsMap.C05, borderRadius: 2,paddingLeft:30,marginTop:30,float:'right'}}>
                    <div style={{padding:'30px 0 30px 0',width:'100%',borderBottom:'1px solid' + colorsMap.C05}}>本次考试后十名的学生</div>
                    <Table tableData={lowStudentsInfo} isGood={false}/>
                </div>
                <div style={{clear:'both'}}></div>
            </div>

            <StudentPerformanceModule reportDS={reportDS}></StudentPerformanceModule>
        </div>
    )
}

function  getTopStudentsInfo(examStudentsInfo){
    var topStudents = _.reverse(_.takeRight(examStudentsInfo,10));//前十个人

    var topStudentsInfo = _.map(topStudents,function(student,index){
    return {
        rank:student.rank,
        name:student.name,
        score:student.score+'',
        school:student.school
    }
    });
    return topStudentsInfo;
}
// function  getLowStudentsInfo(examStudentsInfo){
//     var lowStudents = _.take(examStudentsInfo,10);
//     var lowStudentsInfo = _.map(lowStudents,function(student,index){
//     return {
//         rank:index+1,
//         name:student.name,
//         score:student.score+'',
//         school:student.school
//     }
//     });
//     return lowStudentsInfo;
// }


function getLowStudentsInfo(examStudentsInfo){
    var lowStudents = _.take(examStudentsInfo,10);
    var lowStudentsRank = _.map(lowStudents,function(obj){
        return obj.rank;
    });
    var lowStudentsInfo = _.map(lowStudentsRank,function(value,index){
        var currentRank = 1;
        var currentScore = lowStudentsRank[0];
        if(value!=currentScore){
            currentRank = index+1;
            currentScore = lowStudentsRank[index];
        }
        return {
            rank:currentRank,
            name:examStudentsInfo[index].name,
            score:examStudentsInfo[index].score+'',
            school:examStudentsInfo[index].school
        }
    })
    return lowStudentsInfo;
}
