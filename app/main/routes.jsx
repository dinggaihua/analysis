import React from 'react';
import { Route, IndexRoute } from 'react-router';

//TODO：各种需要的router page
import App from '../containers/App';
import Dashboard from '../containers/Dashboard';
// import SchoolAnalysis from '../containers/SchoolAnalysis';
// import Home from '../containers/Home';

import Test from '../containers/Test'
import Home from '../containers/Home';
import SchoolReport from '../containers/SchoolReport';
/*
当Route内嵌的时候，使用相对path则会继承上一级的路由path，如果使用绝对path（即前面加上"/"），则不会继承上一级的path
 */
export default (store) => {
    return (
        <Route path="/" component={App}>
            <IndexRoute component={Test} />
            <Route path='home' component={Home} />
            <Route path='dashboard' component={Dashboard} />
            <Route path='school/report' component={SchoolReport} />
        </Route>
    );
};

/*

        /:examId/

        <Route path="/" component={App}>
            <IndexRoute component={Home}/>
            <Route path="/exams/:role/:class" component={KaoShiLieBiao}/>
            <Route path="/examdetail" component={ExamDetail}>
                <Route path="/examdetail/collection/:examid" component={ExamDetailCollection}>
                <Route path="/examdetail/collection/:examid/global" component={ExamDetailCollectionGlobal}/>
                <Route path="/examdetail/collection/:examid/:single" component={ExamDetailCollectionSingle}/>
                </Route>
                <Route path="/examdetail/analyze/:examid" component={ExamDetailAnalyze}>
                <Route path="/examdetail/analyze/:examid/:single" component={ExamDetailAnalyzeSingle}/>
                </Route>
            </Route>
        </Route>
*/
