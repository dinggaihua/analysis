import React from 'react';
import styles from '../../common/common.css';
import moment from 'moment';
import {Link} from 'react-router'
import {initParams} from '../../lib/util';
import Radium from 'radium';

@Radium
class Header extends React.Component {
    constructor(props) {
      super(props);

    }

    downloadFile() {
        var params = initParams(this.props.params, this.props.location, { 'request': window.request });
        var url = this.props.location.pathname+this.props.location.search;

        params.request.post('/file/render', {url: url}).then(function(res) {
            var targetFileName = res.data;
            saveAs("http://localhost:3000/api/v1/file/download?filename="+targetFileName);
            //TODO: 删除文件
            setTimeout(function() {
                params.request.delete('/file/rm?filename='+targetFileName);
            }, 4000);
        }).catch(function(err) {
            console.log('err = ', err);
        })
    }

    render() {
        var {examInfo} = this.props;
        var startTime = moment(examInfo.startTime).format('YYYY.MM.DD');
        var {examid, grade} = this.props.location.query;
        
        return (
            <div>
                <div style={{ height: 110, padding: '40px 0 20px 20px', backgroundColor: '#fcfcfc', position: 'relative' }}>
                    <a href={'/dashboard?' + 'examid=' + examid + '&grade=' + encodeURI(grade)} style={[localStyle.goBackLink,{ float: 'left'}]}>{String.fromCharCode(60) } 返回</a>
                    <div style={{ margin: "0 auto", fontSize: 20, width: 600 }}>
                        <div style={{ textAlign: 'center' }}>{examInfo.name}</div>
                        <div style={{ textAlign: 'center' }}>学校总体分析诊断报告</div>
                    </div>
                    <a href='javascript: void(0)' className={styles.button}
                        onClick={this.downloadFile.bind(this)}
                        style={{
                            width: 120, height: 30, borderRadius: '20px', backgroundColor: '#698fba', color: '#fff', lineHeight: '30px',
                            position: 'absolute', right: '30px', top: '50%', marginTop: '-15px'
                        }}>
                        下载报告
                    </a>
                </div>
                <div className={styles['school-report-content']}>
                    <p style={{ lineHeight: '2', marginTop: 40, textIndent: 28 }}>
                        本次考试（考试时间： <span className={styles['school-report-dynamic']}>{startTime}</span>），
                        我校<span className={styles['school-report-dynamic']}>{examInfo.gradeName}</span>年级<span className={styles['school-report-dynamic']}>{examInfo.realClasses.length}</span>个班级
                        共<span className={styles['school-report-dynamic']}>{examInfo.realStudentsCount}</span>名学生参加，进行了
                        <span className={styles['school-report-dynamic']}>
                        {
                            _.map(examInfo.subjects, (subject, index) => {
                                if (index === examInfo.subjects.length -1) {
                                    return subject
                                }
                                return subject + '、'
                            })
                        }
                        </span>
                        ，共<span className={styles['school-report-dynamic']}>{examInfo.subjects.length}</span>个学科的考试。
                        对全校整体考试结果的分析，可以得到如下诊断分析意见。
                    </p>
                </div>
            </div>
        )
    }
}

var localStyle={
    goBackLink: {
        color: '#333',
        ':hover': {textDecoration: 'none', color: '#333'}
    }
}
export default Header;

function saveAs(uri, filename) {
    var link = document.createElement('a');
    if (typeof link.download === 'string') {
        document.body.appendChild(link); //Firefox requires the link to be in the body
        link.download = filename;
        link.href = uri;
        link.click();
        document.body.removeChild(link); //remove the link when done
    } else {
        location.replace(uri);
    }
}
