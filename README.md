# web-media
_For example, a client application. Music player to Spotify Web SDK Player._

Attempt to provide simple architecture. Just pure implementations. Small prototypes combined together. Without any extra tools.
Which would help focus on the understanding of the general concepts.

The solution contains the list of following patterns
- Architecture of ports and adapters (Hexagonal)
- IoC for dependency injection
- Model View ViewModel architecture
- Properties Data Binding
- Data selectors and Commands

The declarative UI programming provides clear UI structure. It is done in React. With Angular it can be achieved even with smaller efforts.
Eventually with some efforts it can be done for other frameworks.

### How to run the application. After checkout
```sh
npm install
npm run start
```
Then open the following URL from your favorite browser: http://localhost:3000

To run unit tests
```sh
npm run test
```

## Architecture of ports and adapters (Hexagonal)
To easily comprehend an application structure. The solution is broken into modules. The Hexagonal architecture works as glue.
Between independent modules. Helps keep all composition loosely coupled. The [core.ts](src/app/core.ts) file contains the initialization part of the whole application.

This version of the implementation consists of several layers.

- [Adapters layer](src/app/adapter/spotify.ts#:~:text=SpotifyAdapter) is to fetch data from a remote API;
- Data layer to cache API data for late use;
- [Services layer](src/app/service/spotify.ts#:~:text=SpotifyService) to contain business logic with implementations of various state transitions;
- View layer to render the state on UI.
- Databinding - [POC](src/app/utils/databinding.ts#:~:text=Binding<T)
- Command dispatcher [Scheduler](src/app/utils/scheduler.ts)
- Functional [Result](src/app/utils/result.ts) and [Option](src/app/utils/option.ts) techniques

## IoC for dependency injection
Let's skip an Inversion of Control implemented by advanced tools. My goal is to focus just on the following tasks.
Keep component's instances through a living time in memory for access. Inject components into other components/modules.
Be an instrument to locate a module instance from other short living components [inject](src/app/utils/inject.ts).

## Model View ViewModel
There are parts of the application that look similar over code implementation. But they are serving different purposes.
To keep business tasks grouped between smaller modules. And avoid code mess. Modules are separated into three kinds.
Views to render application states on UI. ViewModels to mediate between View and Services. Services are modules that keep the
runtime state of the application in smaller parts.

## Data binding
The goal of databinding is to notify about state changes. Be a good basis platform to achieve correct data synchronisation.
Prevent data synchronisation errors.

This is a complex task. Weak approach could lead to unexpected errors that are hard to understand. Byt I could try to resolve it.
Let's set the following agreement. Just two rules.

- There should be a single source of truth. Let's call it [state](src/app/utils/databinding.ts#:~:text=State<T>).
- The only notification that could be listened from a UI is a refresh UI notification. e.g. [Notifications.observe](src/app/views/homeView.ts#:~:text=Notifications.observe)

Single source of truth would help to prevent a desynchronised state.
The UI update notification would force UI to redraw. Which is just to read all data from provided properties.

## Data selectors and commands
There is another smaller but yet important separation. Such an approach helps to comprehend data synchronisation issues.
Similar to data binding there is agreement to split state synchronisation on two big tasks: read and write. Reading state
is done by selectors. Writing state is performed by command methods.

Addressing this concept in the project. Selectors are represented by lists of properties grouped into ViewModels.
Command methods are encapsulated into command entities. Such commands are provided in properties from ViewModels as well.

## Command dispatcher
When the application is working. It could encounter errors. Such errors can be separated from unexpected errors that come
from using the application. And errors that are consequences of luck or breaking features. Since the application is developing.

To provide a flexible error recovery of some unexpected issues. It would be nice to have a tool that helps to achieve it.
Here we can recover from the following errors.

- Token expired error
- Device not found error
- Unexpected remote API error

Token expired error is resolved in the way to automatically raise a background process of refreshing the token.
Device not found error is resolved by showing Select Device Dropdown on UI.
Unexpected remote API error is resolved by forsing API http request to retry 3 times then fail with the issue.

## Summary
Such a combination of the following patterns: IoC/Hexagonal architecture/MVVM with Databinding/Command scheduler.
It provides a flexible and easy scalable project. By a small set of coding techniques. For non-production working concepts.

The combination helps to build applications of any size. Assists in better business logic separation from platform/system
capabilities. Elaborates into producing a clear understanding of what modules of the application are aligned according to
business requirements.

From this project there is the ability to update personal knowledge about how more advanced tools with similar concepts
would work together. For the fully scalable production solution.

This is how it looks in the browser:

<img width="370" alt="image" src="https://user-images.githubusercontent.com/4933561/213888715-e965c81f-339b-48f7-95fb-f5af5bd3877d.png">

