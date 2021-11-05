import React, { Component } from "react";
import classnames from "classnames";
import Loading from "./Loading";
import Panel from "./Panel";
import axios from "axios";

import {
  getTotalInterviews,
  getLeastPopularTimeSlot,
  getMostPopularDay,
  getInterviewsPerDay
 } from "helpers/selectors";

 import { setInterview } from "helpers/reducers";

const data = [
  {
    id: 1,
    label: "Total Interviews",
    getValue: getTotalInterviews
  },
  {
    id: 2,
    label: "Least Popular Time Slot",
    getValue: getLeastPopularTimeSlot
  },
  {
    id: 3,
    label: "Most Popular Day",
    getValue: getMostPopularDay
  },
  {
    id: 4,
    label: "Interviews Per Day",
    getValue: getInterviewsPerDay
  }
];


class Dashboard extends Component {
  // state declarations here
  state = {
    loading: true,
    focused: null,
    days: [],
    appointments: {},
    interviewers: {},
  };

  // lifecycles
  componentDidMount() {
    const focused = JSON.parse(localStorage.getItem("focused"));

    if (focused) {
      this.setState({ focused });
    }

    // Axios API calls
    Promise.all([
      axios.get("/api/days"),
      axios.get("/api/appointments"),
      axios.get("/api/interviewers")
    ]).then(([days, appointments, interviewers]) => {
      this.setState({
        loading: false,
        days: days.data,
        appointments: appointments.data,
        interviewers: interviewers.data
      });
    });
    
    this.socket = new WebSocket(process.env.REACT_APP_WEBSOCKET_URL);
    
    // listen for changes over websocket
    this.socket.onmessage = event => {
      const data = JSON.parse(event.data);
    
      if (typeof data === "object" && data.type === "SET_INTERVIEW") {
        this.setState(previousState =>
          setInterview(previousState, data.id, data.interview)
        );
      }
    };
  }
  
  componentWillUnmount() {
    this.socket.close();
  }

  componentDidUpdate(previousProps, previousState) {
    if (previousState.focused !== this.state.focused) {
      localStorage.setItem("focused", JSON.stringify(this.state.focused));
    }
  }

  // pass selected panel id to focus state, toggle current state
  selectPanel(id) {
  this.setState(previousState => ({
    focused: previousState.focused !== null ? null : id 
    }));
  }
  
  render() {
    console.log(this.state);
    // adds focus class to panels via onClick setState 
    const dashboardClasses = classnames("dashboard", {
      "dashboard--focused": this.state.focused
     });

    // shows loading component 
    if (this.state.loading) {
      return <Loading />
    };
    
    // creates an array from the mock data, filtering based on if in-focus
    const panels = data
      .filter(
        panel => this.state.focused === null || this.state.focused === panel.id
      )
      .map(panel => (
      <Panel 
        key={panel.id} 
        value={panel.getValue(this.state)}
        onSelect={event => this.selectPanel(panel.id)} 
        {...panel} 
      />
      ));
    
    // renders our component here
    return <main className={dashboardClasses}>{panels}</main>;
  }
}

export default Dashboard;
