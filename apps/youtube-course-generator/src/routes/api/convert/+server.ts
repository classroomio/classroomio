import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import youtubedl from 'youtube-dl-exec';
import axios from 'axios';
import { ASSEMBLYAI_API_KEY, OPENAI_API_KEY } from '$env/static/private';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY
});

export const POST: RequestHandler = async ({ request }) => {
  const { youtubeUrl } = await request.json();

  try {
    // Fetch video information
    const videoInfo = await youtubedl(youtubeUrl, {
      dumpSingleJson: true,
      noCheckCertificates: true,
      noWarnings: true,
      preferFreeFormats: true,
      addHeader: ['referer:youtube.com', 'user-agent:googlebot']
    });

    // Extract relevant information
    const title = videoInfo.title;
    const duration = videoInfo.duration;
    const description = videoInfo.description;

    // Get audio URL
    const audioUrl = videoInfo.formats.find((format) => format.ext === 'm4a').url;

    console.log('audioUrl', audioUrl);

    // // Transcribe audio
    // const transcript = await transcribeAudio(audioUrl);
    const transcript = mockText();

    // Analyze transcript to create course structure
    const lessons = await createLessonsFromTranscript(transcript, duration);

    // Generate quizzes for each lesson
    const lessonsWithQuizzes = await generateQuizzes(lessons);

    const course = {
      title,
      description,
      totalDuration: formatDuration(duration),
      lessons: lessonsWithQuizzes,
      transcript
    };

    return json(course);
  } catch (error) {
    console.error('Error processing video:', error);
    return json({ error: 'Failed to process video' }, { status: 500 });
  }
};

export const PUT: RequestHandler = async ({ request }) => {
  const course = await request.json();

  try {
    // Here you would typically save the edited course to a database
    // For now, we'll just return the course as-is
    return json({ message: 'Course updated successfully', course });
  } catch (error) {
    console.error('Error updating course:', error);
    return json({ error: 'Failed to update course' }, { status: 500 });
  }
};

function mockText() {
  return `Hey guys, welcome to my Rethink DB crash course. So I was asked a while ago to do a crash course on Rethink and I never got into it until recently where I was doing a node JS patterns course on I think was pluralsight and the instructor used rethink instead of Mongo and I really liked it. It's kind of a mix of MongoDB and relational databases and in addition to that it's built for real time apps where instead of pulling for changes like traditional databases, you can tell Rethink to continuously push query results to the application in real time. You can see kind of a little example right here that's running. Now we're not going to really get into that because this is an introductory course. I basically want to go over the syntax, the query language, which is called reqlite, I guess rethink, rethink query language. And I want to get you familiar with that. I'm going to have a cheat sheet in the description that will have you know how to create a database, create tables, insert and select all that, all that stuff. Alright, so we're going to get this installed locally and there's actually something called the data explorer that we can use to write queries. And if we have enough time then I'll jump into node js and show you how to just do something simple, how to fetch data, set it up and maybe even python. Alright, so let's jump in. I'm going to go to install rethink now if you're on windows all you have to do is download the, I think it's an exe file that's inside of a zip. So just take the exe out and then put it wherever you want to put it and open up a command line and just type in rethink and it should rethink DB and it should just run. You can also use docker if you want. I'm just going to set this up on my Mac. So I'm going to choose OsX. You can use homebrew if you want. I'm just going to download the disk image and then we can run this rethink pkg file. Alright, so let's open this up. Okay, so let's go ahead and let's double click this. Okay, now you might get a security warning if you do just go to your system preferences on your Mac, go to security and then allow open app. Alright, so let's go through this installation real quick. Yeah, agree, install. All right. Okay, so now rethink is installed I'm just gonna move this installer to the trash and close this up. Okay, so now we should be able to open up a terminal and simply run rethink DB. And there we go, you can see server ready and we can go to port 8080 in our browser and we can do, it's basically a gui to manage our databases. Now if you're on Windows again, you just want to take the executable and you want to run that from the command line and you should get this same result and it should run on localhost, port 8080 and there we go. So it's as easy as that to get set up. Now from here we have some analytics performance, stuff like that. If we look at tables, this will show all of our databases. You can see we have a test database here with no tables by default, but we can add tables from here, delete tables, add a new database, delete a database, servers. This just shows us our server and then the data explorer is where we're going to spend the majority of our time because this is where we can actually make queries. Okay, I want you to get familiar with the syntax of writing these queries. So I'm going to just make this a little bigger here. Now you might be saying, well, what's the use of writing queries in here? The drivers you're going to be using for node or Python, Ruby, whatever it is you're using, rethink with the syntax is very similar to what we're going to do here. Again, I might get into that later. I might jump into Python and do something as well as node. But this will teach you reql, which is the rethink query language. And this is nice because you can just type in like if I do r, it'll show me all the options that I have here. And I'm not going to go through everything. We're just going to do pretty much the basics here just to get you started. Now I do have a GitHub gist that I'll put a link in the description to, which is this cheat sheet, so much like my Mysql course. This just has all the queries that we'll be running. Okay, so you might want to open that up as well. So first thing I want to do is create a new database because I don't want to use the test database. So what we can do is r. So everything's going to start with R. Okay, so basically rethink and then we're going to do a DB create camel case and I'm going to create a database and you can see this nice little dropdown here that tells us exactly what these, these methods do and gives us an example of the response and all that. So let's say mydb. Okay? So if we click run that should create a new database. And if I go to tables I'll just open that in a new tab. Now we have this mydb. Okay so that's how we can create a database. If we want to get rid of a database we can do db drop. In fact I'll go ahead and drop the test database. So if we run that and I go back and reload, now the test database is gone. Okay. If we want to list out our databases we can do DB list. So if we run that, there we go. This rethink doesn't show but it is there just doesn't show right here. So that will list out the databases. Now if you ever want to run a query that you already have you can go to history and you can simply load one of these up. So you can just hit load, it'll get put in here and you can click run. Okay so we might be using that a little bit. Alright, so we have a table. Let's, I mean I'm sorry, we have a database. Let's create a table. So pretty much from now on when we're dealing with the MyDB database we're going to do our db and then select our database which is going to be MyDB. I'm just going to make this a little bigger. Here we go. Actually we might not be able to, we'll try it out. So we have MyDB and then we're going to do a table create and you can see we get a little dropdown. I can click that. And then in here we want to put the name of our table, I'm going to call it users. Let's close that up and run it. And we just get this response. Yeah, I'm going to make this a little smaller. So the response gives us a bunch of stuff here, gives us the iD, the name, the primary key. So in rethink you do have a concept of primary keys. It does create an id automatically and that's going to be your primary key. However you can explicitly set something else to the primary key if you want. Okay, if we go to this screen here now you can see we have a users table in our MyDB database. Okay, so next thing I want to do now that we have a table is let's insert something. So we're going to keep this selection of MyDB and then we're going to do table dot not dot table and then parentheses and we want table. Let's create users. Okay, I'm not create users but insert into users. So we want to do dot insert. Now insert, as you can see right here, it can take in either an object or an array. So if you want to insert a single record or row, then you want to put an object. If you want multiple, then you would do an array. So let's do a single record first. So users are going to have a name. I should probably put a capital t for my last name. And they're going to have a city and an age. Okay, so that's an insert query. So very similar to Mongodb. So let's go ahead and run. And it gives us this inserted one generated keys. Now if we want to select or show the, the records inside the users table, then what we can do is just get rid of this insert and simply run mydb table dot our table users. And there we go. So we have one row in our database. Now if we want to insert multiple rows, we can put an array instead of an object. So what I'm going to do is paste this in just so I don't have to type all this out. So same thing, dot tableusers, dot insert. But you can see we have an array of objects this time. So I'm going to run that and we get inserted for, and if I go to my history and I choose this right here, I'm going to load this query up to just check it out. And now you can see that we have, what is it, five users in our database. Okay, so pretty simple stuff. Now if we want to filter like let's say, let's see, we have two people with the city of Boston. Let's say we want to filter Boston. So this is basically like a where clause in a relational database. So we just put in an object, we want to say filter by city. So anyone that is in the city of Boston, you can see now we have two records, two rows. Okay, now we're selecting every field from every row. We might not want to do that. Let's say we only want to get the name and the age. So what we can do is tack on to the end here. We can do dot pluck and let's say pluck. Actually what we can pass in here is either a single value like we could get just name, or if we want to get more than one, I believe we can pass in an array. So let's get the name and let's get the age. Oops, should be in quotes. Name, age. Let's run that. And there we go. So now, and you can see we can, we can use this dot syntax, very JavaScript like. So we filtered out just the people from Boston and we got just their name and age and let's see what else do we want to do here? If we want to order by something, we can use order by. So what I'll do is just, let's not even use filter, we'll just get all of these and we can just simply do order by and then we can pass in here. R if we want descending, we can do Desc and then the field we want to order by. Let's just do name and run. And now you can see that they're ordered by name from, you know, descending. Okay, so that's order by. There's a lot of similarities to relational databases as well. So that's why I said it's kind of like a mix of both. Let's see if we want to limit. Let's say we only want to get two. We can tack on to this limit two and run and we only get two. So for pagination and stuff like that, if we want to count the number of rows we can just simply use count and we'll run. And you can see we get five. We also have distinct. So let's say that we only want a list of the cities that are available and we don't want like the same city twice. We want it to be distinct. So let's actually, we'll just go like this. So let's, let's actually get just the city. So we'll pluck out the city but we want to do distinct. You see that pops up here. So removes duplicates from elements in c in a sequence. Okay, so we'll just do distinct and run. And now you can see the three cities that are available. Alright, we can also do greater than and less than or greater than or equal to. So let's say we want to get, we're going to do a filter here and let's say rho. So I'm going to say where the age is dot gt. So greater than, let's say 35. So if I run that we're going to get all the users. Wow, I'm old. All the users that are above 35. We can also do GTE. I think we have a 35 year old in there. I'm sorry Ge, not GTE. Yep. So now you can see it gets Jen Williams who is 35. We can do Le which is less than or equal to or just Lt, which is less than. Okay, so let's move on to updating rows, updating data. So let's say we want to update. Actually, you know what I'll do is just, let's load all our users. So I'm just going to load this query and run it here. And let's grab, let's see Jen Williams, let's grab her id and let's say that she moved to, I don't know, San Jose. So we want to update her city. So what we could do is this right here. We want to do a filter and we want to filter by the id. So I'm going to just throw that id in there. When you do an update, you want to filter by the id or some unique key and then we can tack on to that update. And this takes in an object and whatever fields we want to update. So I'm going to say city and let's change it to San Jose. And if we run that, you can see we get replaced one. And I'm just going to go ahead and load the users again. And if we look at Jen Williams, our city is now San Jose. Okay. So updating is pretty simple. Deleting also. Very simple. I'm going to load up the update that I just did and instead of update I'm going to do delete like that and run. And then if we load the users again, you'll see that Jen is gone. Okay. So that's how we can delete a record. So now I want to look at joins. Okay, so what I mean if you don't know what a join is, it's basically where you want to fetch data from multiple tables. So let's say we have, we have our users table and maybe we have a tasks table and that a task can be created by a user. So you would have a special key, usually called a foreign key that would represent the user's id for that task. So in order to do this, we're going to create a new table. So let's do our db. We want to do table create. So table create and you can do posts or to dos, whatever. I'm just going to do tasks and let's run. Okay, so that will create the table. Now I want to populate that table with some stuff. So we're going to do table and let's choose the tasks table and let's do an insert. Actually, you know what we need to know the ids that we want first. So what I'll do is just cut that and from our history let's load up our users so we can see their ids. Okay. And then we'll go ahead and insert and let's do an array. And each object is going to have a user, let's call it user id. And it's also going to have a, we'll just do text and I'll just say like task one. Okay. And then I'm going to grab the ids. Let's grab my id here. Alright. And then let's put a comma here. And then we'll just grab this. I'll do like four tasks. So we get task two, three, four and let's just grab another person's id. We'll grab Steve's. So Steve will do task two and I guess Sarah will grab hers. She can do task four. Alright. So we'll go ahead and run this and let's check out the tasks table. So I'll load this up except I'm going to change this to tasks and this should show us all of our tasks. Now the idea with a join is we want to be able to see right now we just see the text in the user id. If you have a web application where you're showing this data, you're probably going to want to show the user's name and stuff like that. So a join is pretty simple here. I'm not going to get too advanced, but let's do table tasks and then we can simply do eq join camel case and this is going to take in basically the foreign key. So in this case it's going to be the user id field. Okay. So we're going to pass in the user id and then we want to do the users database because that's what we're joining in here. So we want to do R Db users and I think that should work. So let's run that database. Users does not exist. Oh, not db table, not tb r table. Hmm. Oh, I got to do both. R Db, select the database which is mydb dot table. There we go. Okay, so by default you can see that we're getting all the fields but it's actually showing us the set, the left and the right table. So the left you can see we just have our task and then right we have the user information. Now we can actually tack on to this dot zip. And what this will do is it'll merge the user in the task and it will overwrite fields in case of a conflict. So if we run that now, you can see that they're all basically together. We just get this one row that has all the information here. And of course you can pluck things out and do all that stuff. Alright, so I think that's going to be it. As far as just, you know, getting into this data explorer, I've showed you what you need for basic crud. You know, create, re read, update and delete. Also some joining, filtering, things like that. So let's do a little something with, let's start with Python. So I'm gonna see, I didn't really plan this part out, but let's create a new folder here and we'll just say rethink, just rethink I guess. Doesn't really matter. Alright, and I'm going to just open this with versus code and let's open up our terminal down here. And I'm just going to create a virtual environment with Pipi and V. And if you're not familiar with Python and Pipi and V, it's fine. I'm not going to spend too much time on this. I just want to give you an example of using the library or the driver. So let's do pip env shell which is going to just start up a project. And to get Pipee and v you have to do pip install pipinv. Okay, so now what I'll do is install with pipianv, rethink DB. So this is going to install the python library or package. Alright, so let's create a file here. I'm just going to call this index dot PI. And this again, this is just to give you an example. I'm not structuring an application or anything like that. So first thing we want to do is import, rethink, rethink db as r now should be just as r now. In past versions you could do like r connect and R db, but now, and I had to actually looks elsewhere because the documentation still says to do that. But I guess now you need to create a variable. So we'll say RBD or RDB should do and set that to r and then rethink db like that, which is a function. And then we basically use that RDb to, to do everything we need. So first thing I'm going to do is connect to our database. So we'll do RDb dot connect. And this is going to take in, let's just put a comment here. Alright, so this is going to take in two things. We're going to set the host, which is our local host in the default, in the port which is the default which is 28015. Okay? And then we just need to do replacement like that and that should allow us to connect to our database. Now what I want to do is go back to the GUI here, the rethink DB and just get rid of these tables. I'm going to keep this MyDB database just because I want to use that. But I'm going to delete the tables and recreate at least the user's table from within Python. Alright? So now you can see we have no tables. So let's go back to our Python script here and let's say create table. So we can take RDB dot DB and select the MyDB database. And then we're going to do table. Now remember what I said when we did the stuff in the data explorer? That syntax is very similar to what you're going to do here to what you're going to do in node and Ruby. It's very similar but there can be some differences. For instance, we don't do create like camel case, we do table underscore create. But basically if you learn the syntax, you learn the syntax and you'll be comfortable in pretty much any, you know, any language that you, you know. So let's do table create users and the other difference, we can't just run it like this, we actually have to tack on dot run like that. So I'm going to go down here and let's run, let's run Python and then index Py, okay? And now if we go back to our GUI here you can see that the users table has been created. Alright? So that's how we can create a table. So if we, I'm just going to comment that out. If we want to insert some data we can do our Db dot db, select our table mydb and let's do dot table, I'm sorry, select the database. Now we're selecting the table and then we can do dot insert. So it's the same exact thing that we did within the data explorer and I'm just going to grab an array of users. Well it's actually a dictionary in Python. Notice we have quotes around the keys as well, but that should insert the data. So I'm going to save that and again run Python index PI and go back and what we can do is go to our data explorer and let's see if we have any users and we'll do this from python in a second. But let's just check it out, make sure those went in and they did nothing. Let's see MyDB table users insert oh, we didn't do run, see we have to do that. Alright, let's run that and go back. Let's run this again. And there we go. So now the users were inserted. Now if we want to get data from Python we can do that. Let's just comment this out. So no, I mean obviously you would structure this in a, the correct way for an application, but just showing the syntax of this. So to get data we would set a cursor. So I'm going to create a variable called cursor and then we're going to do RDB dot DB, select MyDB and select the table and then dot run. Now this puts it in a cursor which is like kind of like a placeholder. And then what we can do is loop through that. So I'm going to just do a for loop. I'm going to say for we'll call this document incursor and then let's just go ahead and print it to the console. So we'll print each document and let's save that and run it. And there we go. So now it's printing out. So obviously, you know, you could use this with, if you're building a web API or if you're building whatever, a web app, whatever it might be, this is the basic syntax. Alright, so that's Python. Now what I'd like to do is a little bit with node js. So I'm going to close that up and I'm going to exit from my python, my Pipian V environment and I'm just going to delete these files. I'm not going to save these. So let's just get rid of these clear directory and now let's do an NPM init. Yeah, that's fine. And then let's do an NPM install rethink DB. It looks like I need to update NPM. That's fine, I clear that out and let's create a new file here called index js. So just like we did with Python, we're going to bring in the library. So we're going to do const r equals require rethink DB. Alright? And I'm going to do a little more here than I did in Python. I'm just going to create some functions. Let's first of all connect so we can do r connect. And this is going to take in an object and we can pass in our host which is going to be localhost pass in our port which again is going to be 28015, that's the default. And then we can also select our database from here. So let's do db and let's say we want to use mydb. And by the way, I'm going to go and just delete the tables again. Or the table, the user's table, let's completely delete that. Alright, so let's see, we have our connection, this is actually, this is actually going to take a callback. So right here let's pass in possible error and our connection. All right. And there's different ways you can handle this because it's asynchronous. What I'm going to do is just create some functions in here and pass because you need to pass in the connection as well. Let's just say if there's an error then throw error. I don't like going from Python to JavaScript in like the same video. So let's create a table. So I'm going to have a function here called create table and let's pass in the connection and we'll just pass in a table name, say users, obviously you can set this up however you'd like, but I'm just creating a separate function. So create table which takes in the connection and table name. Okay. And from here we can do r db and we'll say my db. Actually you know what, I don't think we need to do this because we selected the default. So I'm going to just try to do r table create and pass in the table name. And then here we want to do a dot run and then this dot run is going to take in the connection and then a callback with a possible error and a result. So I'm just using, I'm using an arrow function here and let's just say if there's an error then throw the error and then let's just do a console log. I'll do a Jason dot stringify just to format it as Jason results. And then we also, we'll just do result. Yeah. So obviously you could use express and you could output this, you know, through an API or whatever, but I'm just logging it. Let's see. So that should work I believe. Let's save it and then let's go down here and run node index. Obviously you have to have node installed. Okay, so that's the response we get back pretty much the same response that we got in the data explorer. And again you can see the same type of, it's the same syntax really. Let's check it out though. So we had, yeah, it created the users table. Now if we want to add some users, let's do that. So we'll just comment this function out and we'll call add users and let's pass in our connection. Okay, so down here let's create a function called add users that takes in the connection and then I'm just going to paste this in real quick. Just array of users that I want to add and let's go down here and let's make our query. So we'll say our dot table users and just like, you know, just like we did in the data Explorer and within Python we're just going to do dot insert and that's going to take in the array that we just created above and then we need to call run and then run is going to take in the connection and then it's going to give us a callback with a possible error and a result. And I'm just going to go ahead and console log, let's do Jason dot stringify. Oops. Jason stringify and pass in the result. Oops, what did I do wrong here? Let's see console log. What the hell did I do wrong? So I got a, oh, I left that off. All right, so let's save that and let's again go down here and let's run node index. Okay, so that should have added the users, as you can see right here it says inserted for, but just to double check, let's go to our data explorer and let's click run. And there we go. So we have our users. So if we want to be able to fetch data we can do that as well. So we'll go back up here and let's say get users and that's going to take in a connection. Alright? And then we'll go down here and say function getusers and we'll say our dot table users and we're just going to do a dot run here. So it's simply r table users and then run, which takes in the connection and gives us a callback with a possible error, I'm sorry, not result in this case we want to do cursor. So this is going to be similar to what we did in Python. So let's see, set that and you can check for the error if you want, but it's fine. I'm going to take that cursor and I'm going to do a two array and this to array is going to take in a function. So I'm going to use an arrow, it's going to be an error and then result. And actually I'll just do a console log directly and then I'm just going to JSON dot stringify the result, get rid of that semicolon. Okay, so let's try that, let's say node index. And there we go. So we can see, we get all the records or all the data or documents, whatever you want to call them, rows that are in our database. Alright, so I mean, I know this is very simple, I'm just showing you the basic syntax, but obviously you could create an express application where you use rethink and you can build real time apps. There's something called dot changes that I didn't go over, but something that's very powerful. I do want to do a project, an actual application, most likely node using rethink so that you can see the benefits of it rather than just learning the syntax. So that's something I will be working on soon, but hopefully you like this crash course. If you did, please leave a like and I'll see you next time. Bye`;
}

async function transcribeAudio(audioUrl: string): Promise<string> {
  const headers = {
    authorization: ASSEMBLYAI_API_KEY,
    'content-type': 'application/json'
  };

  // Start transcription job
  const response = await axios.post(
    'https://api.assemblyai.com/v2/transcript',
    {
      audio_url: audioUrl
    },
    { headers }
  );

  const transcriptId = response.data.id;

  // Poll for transcription completion
  while (true) {
    const pollingResponse = await axios.get(
      `https://api.assemblyai.com/v2/transcript/${transcriptId}`,
      { headers }
    );
    const transcriptionResult = pollingResponse.data;

    if (transcriptionResult.status === 'completed') {
      return transcriptionResult.text;
    } else if (transcriptionResult.status === 'error') {
      throw new Error(`Transcription failed: ${transcriptionResult.error}`);
    } else {
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
}

async function createLessonsFromTranscript(
  transcript: string,
  totalDuration: number
): Promise<{ title: string; duration: string; content: string }[]> {
  const prompt = `
    Analyze the following transcript and divide it into 5-8 logical lessons. For each lesson, provide:
    1. A concise title
    2. The content of the lesson

    Transcript:
    ${transcript}

    Format your response as a JSON array where each element is an object with 'title' and 'content' properties.
    `;

  const response = await openai.chat.completions.create({
    model: 'gpt-4-1106-preview',
    messages: [
      {
        role: 'system',
        content:
          'You are a JSON generator. Your responses should only contain valid JSON arrays without any additional text, formatting, or explanation.'
      },
      { role: 'user', content: prompt }
    ],
    temperature: 0.7,
    response_format: { type: 'json_object' }
  });

  console.log('response', response.choices[0]);
  const lessonsData = JSON.parse(response.choices[0].message.content || '[]');
  const lessonCount = lessonsData.length;
  const avgDuration = totalDuration / lessonCount;

  return lessonsData.map((lesson: { title: string; content: string }) => ({
    title: lesson.title,
    duration: formatDuration(avgDuration),
    content: lesson.content
  }));
}

async function generateQuizzes(
  lessons: { title: string; duration: string; content: string }[]
): Promise<
  {
    title: string;
    duration: string;
    content: string;
    quiz: { question: string; options: string[]; correctAnswer: string }[];
  }[]
> {
  const lessonsWithQuizzes = [];

  for (const lesson of lessons) {
    const prompt = `
    Based on the following lesson content, generate a quiz with 3 multiple-choice questions. Each question should have 4 options.

    Lesson Title: ${lesson.title}
    Lesson Content: ${lesson.content}

    Format your response as a JSON array of question objects, each with 'question', 'options' (an array of 4 strings), and 'correctAnswer' properties.
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-4-1106-preview',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1000
    });

    const quizData = JSON.parse(response.choices[0].message.content);

    lessonsWithQuizzes.push({
      ...lesson,
      quiz: quizData
    });
  }

  return lessonsWithQuizzes;
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}
