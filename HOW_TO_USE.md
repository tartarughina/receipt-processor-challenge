# Install

The server container can be installed by executing the following command:

```bash
docker build -t receipt-server .
```

# Run

The container can be run by executing the following command:

```bash
docker run -p 3000:3000 -e PORT=3000 receipt-server
```

By default the server will be listening on port 3000, this however can be overridden by setting the `PORT` environment variable.
As a result match the arguments of `-p` to the value of `PORT`.
