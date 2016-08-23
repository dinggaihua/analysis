//班级报告靠上面的模块导航（在考试信息描述的下面）

import React, { PropTypes } from 'react';

import {COLORS_MAP as colorsMap} from '../../../../lib/constants';

var modules = [
    {
        name: '总分分布趋势',
        id: 'totalScoreTrend'
    }, {
        name: '总分分档学生人数分布',
        id: 'levelDistribution'
    }, {
        name: '学科分档人数分布',
        id: 'scoreLevel'
    }, {
        name: '临界生群体分析',
        id: 'criticalStudent'
    }, {
        name: '学科考试表现',
        id: 'subjectPerformance'
    }, {
        name: '学科考试内在表现',
        id: 'subjectInspectPerformance'
    }, {
        name: '重点学生信息',
        id: 'studentInfo'
    }, {
        name: '历史表现比较',
        id: 'historyPerformance'
    }
];

class ModuleNav extends React.Component {
    constructor(props) {
        super(props);
        this.state= {
            activeId: 'totalScoreTrend',
            position: 'normal'
        }
    }

    scrollHandler(navBarTop, scrollTopList) {
        var bodyTop = $('body').scrollTop();
        //判断何时吸顶
        if (navBarTop <= bodyTop) {
            if (this.state.position !== 'fixed') {
                this.setState({
                    position: 'fixed'
                })
            }
        } else {
            this.setState({
                position: 'normal'
            })
        }

        for (var i in scrollTopList) {
            if (scrollTopList[i] <= bodyTop + 100 && scrollTopList[i] >= bodyTop - 100) {
                this.setState({
                    activeId: modules[i].id
                })
                return;
            }
        }

    }

    componentDidMount() {
        var navBarTop = document.getElementById('navBar').offsetTop;
        var scrollTopList = [];
        _.forEach(modules, (module, index) => {
            var moduleEle = document.getElementById(module.id);  
            if(!moduleEle) {
                console.log(module.id + ' not found!');
            } else {
                scrollTopList.push(moduleEle.offsetTop)
            }
        })
        var $body = $('body');
        this.scrollHandlerRef = this.scrollHandler.bind(this, navBarTop, scrollTopList);
        window.addEventListener('scroll', this.scrollHandlerRef);

    }

    componentWillUnmount() {
        window.removeEventListener('scroll', this.scrollHandlerRef);
    }

    onClickModule(event) {
        var $target = $(event.target);
        var id = $target.data('id');
        if (!id) {
            id = $target.parent('#nav-item').data('id');
        }
        $('body').scrollTop($('#' + id).offset().top - 100) // -100适当补回导航栏遮挡的部分
        this.setState({
            activeId: id
        })

    }

    render() {
        var moduleLen = modules.length;
        var {position} = this.state;
        return (
            <div id='navBar' style={_.assign({}, {zIndex: 1, right: 0, height: 50, display: 'table-row',borderTop: '1px solid ' + colorsMap.C04, backgroundColor: colorsMap.C02},
                                    position === 'normal' ? {position:'relative', width: '100%', bottom: 0, left: 0} : {position: 'fixed', top: 0, width: '100%', borderBottom: '1px solid ' + colorsMap.C04})}>
                <div style={_.assign(position !== 'normal' ? {position: 'absolute', left: '50%', marginLeft: -600} : {})}>
            {
                modules.map((module, index) => {
                    return (
                        <div key={'navItem-' + index} id='nav-item' style={{display: 'table-cell', minWidth: 1200/moduleLen, height: 50, textAlign: 'center', verticalAlign: 'middle', fontSize: 12, cursor: 'pointer'}}
                             data-id={module.id} onClick={this.onClickModule.bind(this)}>
                            <span style={_.assign({}, {height: 12, float: 'left', marginTop: 2}, index === 0 && position !== 'normal'? {borderRight: '1px solid ' + colorsMap.C04, display: 'inline-block'} : {})}></span>
                            <span style={this.state.activeId === module.id ? {paddingBottom: 16, borderBottom: '2px solid ' + colorsMap.B03, color: colorsMap.B03} : {}}>{module.name} </span>
                            <span style={_.assign({}, {display: 'inline-block', height: 12, float: 'right', marginTop: 2}, index === modules.length -1 && position === 'normal'? {}: {borderRight: '1px solid ' + colorsMap.C04})}></span>
                        </div>
                    )
                })
            }
            </div>
            </div>
        )
    }
}

export default ModuleNav;



//=================================================  分界线  =================================================
