
# IP Explorer

A discovery and diagnostics tool which analyzes NYC Mesh IP addresses and shows the user useful information about them.
Pulls from a variety of data sources to make the folowing information available:

- ✅ Network Number (and address breakdown)
- ✅ Other IP addresses for this node
- ✅ ICMP Ping (Latency & Packet Loss)
- ✅ Common TCP Port Status (22, 80, 443)
- ✅ OSPF Table
- ✅ SNMPv1 Data
- ✅ Reverse DNS
- ✅ DHCP Leases (via SSH to the Mikrotik Router)
- ✅ UISP
- ✅ IPRanges Google Spreadsheet

![A screenshot of the IP explorer tool in use](/screenshots/img1.png?raw=true)


## Get Started

If you just want to use this tool and don't need to host your own copy or do development work,
just connect to the mesh and then check it out at:

[http://ip-explorer.andrew.mesh](http://ip-explorer.andrew.mesh)

## Built with
- [NextJS](https://nextjs.org/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind](https://nextjs.org/)
- [React](https://react.dev/)

## Setup

Pre-requisites: `npm` (node 22+) available via the shell. Check with:
```sh
node --version
```

Then setup by cloning, creating the `.env` file, and installing the dependencies
```sh
git clone https://github.com/Andrew-Dickinson/ip-explorer
cd ip-explorer
cp .env.example .env
nano .env # Or your favorite text editor, set values for all the variables if you can, otherwise some cards won't work
npm install
```

## Running the unit tests

Follow the instructions under "Setup" above, to clone a local copy of this application. Then invoke the test suite 
using npm:
```
npm test
```

## Running the dev server for local development

Start the dev server with the following command:
```sh
npm start
```

A local copy of the tool should be accessible at [http://127.0.0.1:3000](http://127.0.0.1:3000)

## Deployment via Docker

To make a production build of this application via docker, simply clone the repo and
use the included build script to create a deployable docker image:

```sh
git clone https://github.com/Andrew-Dickinson/ip-explorer
bin/docker_build.sh
```

This should create a docker image called `ip-explorer`, which can be run with:
```sh
docker run -d -p 3000:3000  ip-explorer
```

You can confirm the docker container was build successfully by opening [http://127.0.0.1:3000](http://127.0.0.1:3000) in your browser.

## License

Distributed under the MIT License. See `LICENSE.txt` for more information.

## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".
Don't forget to give the project a star! Thanks again!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request


## Acknowledgments
* [Best-README-Template](https://github.com/othneildrew/Best-README-Template/)