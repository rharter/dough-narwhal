var File = require('file'),
    Router = require('./router');

var server = exports.server = {
	start: function(root, port) {
		var jetty = JavaImporter(Packages.org.eclipse.jetty.embedded,
		                         Packages.org.eclipse.jetty.server,
		                         Packages.org.eclipse.jetty.server.handler,
		                         Packages.org.eclipse.jetty.server.nio,
		                         Packages.org.eclipse.jetty.server.session,
		                         Packages.org.eclipse.jetty.util.thread);

		with (jetty) {
			var server = dough.server.server = new Server();
			server.setStopAtShutdown(true);
			
			// Increase the thread pool
			var threadPool = new QueuedThreadPool();
			threadPool.setMaxThreads(100);
			server.setThreadPool(threadPool);
			
			// Ensure using the non-blocking connector
			var connector = new SelectChannelConnector();
			connector.setPort(port || 8080);
			connector.setMaxIdleTime(30000);
			server.setConnectors([connector]);
			
			// Add the handlers
			var handlers = new HandlerList();
			
			handlers.addHandler(new SessionHandler());
			
			var publicHandler = new ResourceHandler();
			publicHandler.setResourceBase(root + '/public/');
			handlers.addHandler(publicHandler);
			
			handlers.addHandler(new JavaAdapter(AbstractHandler, server));
			
			server.setHandler(handlers);
			
			server.start();
			server.join();
	    }
	},

	handle: function(java_target, java_base_request, java_request, java_response) {
		var request = new _Request(java_request);
		request.target = java_target + '';

		var route = Router.resolve(request.target, request.method);

		if (!route) {
			this.print("No route matches [" + request.method + "] \"" + request.target + "\"\n");
			return;
		}

		this.print("Processing with " + JSON.stringify(route.pattern));

		request = route.evaluateParams(request);
		var ret = route.handler(request, java_response);

		if (ret) {
			var outputStream = null;
			try {
				outputStream = java_response.getOutputStream();
				outputStream.print(ret.toString());
			} catch (e) {
				this.print("Error: " + e.toString());
			} finally {
				if (outputStream !== null) {
					outputStream.close();
				}
			}
		}
	},

	/**
	 * A javascript wrapper for the Java response object.
	 *
	 */
	_Request: function (request) {
		this._request = request;

		this.method = request.getMethod() + '';
		this.query = request.getQueryString() + '';
		this.path = request.getPathInfo() + '';
		this.client_address = {
			port: request.getRemotePort(),
			host: request.getRemoteHost(),
			address: request.getRemoteAddr()
		};

		this.params = {};
		var names = request.getParameterMap().keySet().toArray().slice();
		for each(var n in names) {
			var v = request.getParameterValues(n);
			if (v.length === 1) {
				this.params[n] = v[0] + '';
			} else {
				this.params[n] = v.slice().map(function (el) { return el + '' });
			}
		}
	}
}