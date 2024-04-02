import React, { useState, useEffect } from 'react';
import { getDatabase, ref, push, get } from 'firebase/database';
import { app } from './firebase';
import 'bootstrap/dist/css/bootstrap.css';
import * as XLSX from 'xlsx';
function AddSchedule() {
 
  const [semester, setSemester] = useState('');
  const [facultyName, setFacultyName] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [subjectDescription, setSubjectDescription] = useState('');
  const [course, setCourse] = useState('');
  const [creditUnits, setCreditUnits] = useState('');
  const [lecHours, setLecHours] = useState('');
  const [labHours, setLabHours] = useState('');
  const [hours, setHours] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [day, setDay] = useState('');
  const [building, setBuilding] = useState('');
  const [room, setRoom] = useState('');
  const [facultyList, setFacultyList] = useState([]);
  const [subjectCodes, setSubjectCodes] = useState([]);
  const [subjectsData, setSubjectsData] = useState([]);
  const [existingSchedules, setExistingSchedules] = useState([]);
  const [yearHeader, setyearHeader] = useState('2023-2024');
  const [schoolYear, setSchoolYear] = useState(yearHeader);
  useEffect(() => {
    // Fetch faculty names from the 'users' collection with 'faculty' role
    const fetchFacultyNames = async () => {
      const database = getDatabase(app);
      const usersRef = ref(database, 'users');

      try {
        const snapshot = await get(usersRef);
        const facultyNames = [];

        if (snapshot.exists()) {
          const usersData = snapshot.val();

          for (const userId in usersData) {
            const user = usersData[userId];
            if (user.role === 'faculty') {
              const fullName = `${user.firstName} ${user.lastName}`;
              facultyNames.push(fullName);
            }
          }

          setFacultyList(facultyNames);
        }
      } catch (error) {
        console.error('Error fetching faculty names:', error);
      }
    };

    // Fetch subject codes from the 'subjects' collection
    const fetchSubjectCodes = async () => {
      const database = getDatabase(app);
      const subjectsRef = ref(database, 'subjects');

      try {
        const snapshot = await get(subjectsRef);
        const subjectCodes = {};

        if (snapshot.exists()) {
          const subjectsData = snapshot.val();

          for (const subjectId in subjectsData) {
            const subject = subjectsData[subjectId];
            subjectCodes[subject.subjectCode] = subject;
          }

          setSubjectCodes(subjectCodes);
          setSubjectsData(subjectsData);
        }
      } catch (error) {
        console.error('Error fetching subject codes:', error);
      }
    };

    // Fetch existing schedules from the 'schedules' collection
    const fetchExistingSchedules = async () => {
      const database = getDatabase(app);
      const schedulesRef = ref(database, 'schedules');

      try {
        const snapshot = await get(schedulesRef);
        const schedulesData = [];

        if (snapshot.exists()) {
          const schedules = snapshot.val();

          for (const scheduleId in schedules) {
            const schedule = schedules[scheduleId];
            schedulesData.push(schedule);
          }

          setExistingSchedules(schedulesData);
        }
      } catch (error) {
        console.error('Error fetching existing schedules:', error);
      }
    };

    fetchFacultyNames();
    fetchSubjectCodes();
    fetchExistingSchedules();
  }, []);

  useEffect(() => {
    if (subjectCode && subjectCodes[subjectCode]) {
      const selectedSubject = subjectCodes[subjectCode];
      setSubjectDescription(selectedSubject.subjectDescription);
      setCreditUnits(selectedSubject.creditUnit);
    } else {
      setSubjectDescription('');
      setCreditUnits('');
    }
  }, [subjectCode, subjectCodes]);

  useEffect(() => {
    const totalHours = parseFloat(lecHours) + parseFloat(labHours);
    setHours(totalHours.toString());
  }, [lecHours, labHours]);

  const handleFileUpload = async (e) => {
    const database = getDatabase(app);
    const schedulesRef = ref(database, 'schedules');
    let schedulesData = [];
    try {
      const snapshot = await get(schedulesRef);
      if (snapshot.exists()) {
        schedulesData = snapshot.val();
       // console.log('schedulesData exist', snapshot.val())
      }
    //  console.log('get shcedules ', snapshot.val())
    } catch (error) {
    //  console.error('Error fetching existing schedules:', error);
    }

    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    const fileReader = new FileReader();
    fileReader.onload = async (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0]; // Assuming data is in the first sheet
      const sheet = workbook.Sheets[sheetName];
      const excelData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      if (excelData.length > 0) {
        const schedulesArray = excelData.slice(1).map(row => ({
            schoolYear: String(row[0]), // Convert to string explicitly
            semester: String(row[1]), // Convert to string explicitly
            subjectCode: String(row[2]), // Convert to string explicitly
            subjectDescription: String(row[3]), // Convert to string explicitly
            lecHours: String(row[4]), // Convert to string explicitly
            labHours: String(row[5]), // Convert to string explicitly
            creditUnits: String(row[6]), // Convert to string explicitly
            course: String(row[7]), // Convert to string explicitly
            hours: String(row[8]), // Convert to string explicitly
            day: String(row[9]), // Convert to string explicitly
            time: String(row[10]), // Convert to string explicitly
            building: String(row[11]), // Convert to string explicitly
            room: String(row[12]), // Convert to string explicitly
            facultyName: String(row[13]), // Convert to string explicitly
        }));
      //  console.log('existingSchedules', existingSchedules);
        schedulesArray.forEach(newSchedule => {
          const existingSchedIndex = existingSchedules.findIndex(existingSchedule =>
            existingSchedule.semester === newSchedule.semester &&
            existingSchedule.day === newSchedule.day &&
            existingSchedule.room === newSchedule.room &&
            existingSchedule.time.trim()=== newSchedule.time.trim()
          );
        
          if (existingSchedIndex !== -1) {
            console.error('Schedule already exists:', newSchedule);
            existingSchedules.splice(existingSchedIndex, 1);
          } else {
            // console.log('Schedule Not exists:', newSchedule);          
            const database = getDatabase(app);
            const schedulesRef = ref(database, 'schedules');
            push(schedulesRef, newSchedule).catch((error) => {
              console.error('Error adding schedule:', error);
              alert(
                'An error occurred while adding the schedule. Please try again.'
              );
            });
          }
        });
        alert('Excel data uploaded successfully!');
      } else {
        alert('No data found in the Excel file.');
      }
    };

    fileReader.readAsArrayBuffer(uploadedFile);
  };
  const handleAddSchedule = () => {
    if (
      !schoolYear ||
      !semester ||
      !facultyName ||
      !subjectCode ||
      !subjectDescription ||
      !course ||
      !creditUnits ||
      !lecHours ||
      !labHours ||
      !hours ||
      !startTime ||
      !endTime ||
      !day ||
      !building ||
      !room
    ) {
      alert('Please fill in all fields.');
      return;
    }

    const existingSchedule = existingSchedules.find(
      (schedule) =>
        schedule.semester === semester &&
        schedule.day === day &&
        schedule.time === `${startTime} - ${endTime}` &&
        schedule.room === room
    );

    if (existingSchedule) {
      alert(
        'A schedule with the same day, time, and room already exists. Please select another schedule.'
      );
      return;
    }

    const database = getDatabase(app);
    const schedulesRef = ref(database, 'schedules');
    const newSchedule = {
      schoolYear,
      semester,
      facultyName,
      subjectCode,
      subjectDescription,
      course,
      creditUnits,
      lecHours,
      labHours,
      hours,
      time: `${startTime} - ${endTime}`,
      day,
      building,
      room,
    };

    push(schedulesRef, newSchedule)
      .then(() => {
        alert('Schedule added successfully!');
        setSemester('');
        setFacultyName('');
        setSubjectCode('');
        setSubjectDescription('');
        setCourse('');
        setCreditUnits('');
        setLecHours('');
        setLabHours('');
        setHours('');
        setStartTime('');
        setEndTime('');
        setDay('');
        setBuilding('');
        setRoom('');
      })
      .catch((error) => {
        console.error('Error adding schedule:', error);
        alert(
          'An error occurred while adding the schedule. Please try again.'
        );
      });
  };

  return (
    <div className="add-schedule-container" style={{ color: '#3d3d3d', padding: '10px', marginTop: '0px', marginBottom: '50px' }}>
      <h2>Add Schedule</h2>
      <h2>{yearHeader}</h2>
      <form>
        <button
          type="button"
          onClick={handleAddSchedule}
          className="btn btn-success"
          style={{
            width: '400px',
            fontFamily: 'Semibold',
            marginLeft: '0px',
            marginTop: '-1%',
            marginBottom: '15%',
            backgroundColor: 'green',
            color: 'white',
            border: 'none',
            padding: '12px',
            borderRadius: '4px',
            cursor: 'pointer',
            width: '400px',
            align: 'center',

          }}
        >
          ADD SCHEDULE
        </button>
        <div>
          <h2>Upload Excel File</h2>
          <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} />
        </div>
        <span style={{ textDecoration: 'line-through' }}></span>{' '}
      </form>
    </div>
  );
}

export default AddSchedule;