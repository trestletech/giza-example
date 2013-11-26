# Hotel

Stores a hotel, floors of the hotel, and rooms of each floor hierarchically. Initially creates a hotel at `/hotel1` then uses a timer to occupy rooms in the hotel, updating the associated objects in Giza each time.

A web browser can monitor this process (by default, running on http://localhost:3000) using socket.io to update itself in real-time by subscribing to Giza events.