# XBR Seller/Buyer with Autobahn-JS

Install NodeJS:

```bash
cd $HOME
wget https://nodejs.org/dist/v10.16.0/node-v10.16.0-linux-x64.tar.xz
tar xvf node-v10.16.0-linux-x64.tar.xz
```

and add the following to `$HOME/.profile`:

```bash
export PATH=${HOME}/node-v10.16.0-linux-x64/bin:${PATH}
```

Install dependencies

```bash
make deps
```

To start the seller run

```bash
make seller
```

For the buyer

```bash
make buyer
```
