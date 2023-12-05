"use client";
import React, { useEffect, useState, useRef } from "react";
import styles from "./page.module.css";
import MemoryComponent from "@/components/MemoryComponent";
import { useUser } from "@clerk/nextjs";

export default function Page() {
  const [journalEntries, setJournalEntries] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentMemory, setCurrentMemory] = useState(null);
  const [fetchTrigger, setFetchTrigger] = useState(false);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const delMemoryId = useRef(null);
  const { user, isLoaded, isSignedIn } = useUser();

  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      // Send the user data to the server
      const createUser = async () => {
        const response = await fetch("/api/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(user),
        });
        console.log(response);
      };
      createUser();
    }
  }, [isLoaded, user, isSignedIn]);

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch("/api/journalEntries");
      const data = await response.json();
      setJournalEntries(data);
    };
    fetchData();
  }, [fetchTrigger]);

  const togglePopup = () => {
    setShowPopup(!showPopup);
    if (isEditing) {
      setIsEditing(false);
      setCurrentMemory(null);
    }
  };

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    const formData = {
      title: event.target.title.value,
      content: event.target.content.value,
      specialLink: event.target.specialLink.value,
      image: event.target.image.value,
    };

    try {
      const response = isEditing
        ? await fetch(`/api/journalEntries/${currentMemory._id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(formData),
          })
        : await fetch("/api/journalEntries", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(formData),
          });

      // Handle response accordingly
      console.log(response.data);
      togglePopup();
      setFetchTrigger(!fetchTrigger);
    } catch (error) {
      console.error("Error submitting memory:", error);
    }
  };

  function editHandler(memory) {
    console.log(memory.title);
    setCurrentMemory(memory);
    setIsEditing(true);
    setShowPopup(true);
  }

  function deleteHandler(memoryId) {
    // Delete logic (to be implemented)
    console.log("Delete memory", memoryId);
    setShowDeletePopup(true);
    delMemoryId.current = memoryId;
  }

  async function confirmDeleteHandler() {
    //make a delete request to the server
    const response = await fetch(`/api/journalEntries/${delMemoryId.current}`, {
      method: "DELETE",
    });
    console.log(response);
    setShowDeletePopup(false);
    setFetchTrigger(!fetchTrigger);
  }

  // Function to update the selected date
  const handleDateChange = (event) => {
    // Convert the selected date to the beginning of the day in UTC
    if (event.target.value === "") {
      setSelectedDate("");
      return;
    }
    const userDate = new Date(event.target.value);
    userDate.setMinutes(userDate.getMinutes() + userDate.getTimezoneOffset());
    setSelectedDate(userDate.toISOString().split("T")[0]);
  };

  const formatDate = (dateString) => {
    // Convert and format the date in UTC
    const date = new Date(dateString);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .split("T")[0];
  };

  // Apply the date filter to journalEntries
  const filteredEntries = journalEntries.filter((entry) => {
    // If no date is selected, return all entries
    if (selectedDate === "") {
      return true;
    }
    // Else, return entries that match the selected date
    return formatDate(entry.dateCreated) === selectedDate;
  });

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <p>Timeline of Moments</p>
        <button
          className={styles.createMemoryBtn}
          onClick={() => togglePopup()}
        >
          CREATE MEMORY
        </button>
      </header>
      {showPopup && (
        <div className={styles.popup}>
          <button onClick={togglePopup} className={styles.closeButton}>
            X
          </button>
          <form onSubmit={handleFormSubmit}>
            <label>
              Summarize today in a few words (Heading):
              <input
                type="text"
                name="title"
                defaultValue={isEditing ? currentMemory.title : ""}
              />
            </label>
            <label>
              What memory do you want to preserve from today?
              <textarea
                name="content"
                defaultValue={isEditing ? currentMemory.content : ""}
              />
            </label>
            <label>
              Share a special piece of media from today:
              <input
                type="text"
                name="specialLink"
                defaultValue={isEditing ? currentMemory.specialLink : ""}
              />
            </label>
            <label>
              Attach a photo you want to remember (URL for now):
              <input
                type="text"
                name="image"
                defaultValue={isEditing ? currentMemory.image : ""}
              />
            </label>
            <button type="submit">{isEditing ? "Update" : "Submit"}</button>
          </form>
        </div>
      )}
      {showDeletePopup && (
        <div className={styles.delPopup}>
          <p>Are you sure you want to delete this memory?</p>
          <button onClick={confirmDeleteHandler}>Yes</button>
          <button onClick={() => setShowDeletePopup(false)}>No</button>
        </div>
      )}
      {/* Date Selector */}
      {/* <div>
        <button onClick={() => setSelectedDate("")}>Clear</button>
      </div> */}
      <input type="date" value={selectedDate} onChange={handleDateChange} />

      <section className={styles.displayMemories}>
        {filteredEntries.map((entry, index) => (
          <MemoryComponent
            key={index}
            memory={entry}
            editHandler={editHandler}
            deleteHandler={deleteHandler}
          />
        ))}
      </section>
    </main>
  );
}
