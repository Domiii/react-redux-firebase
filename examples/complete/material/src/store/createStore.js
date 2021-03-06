import { applyMiddleware, compose, createStore } from 'redux'
import thunk from 'redux-thunk'
import { browserHistory } from 'react-router'
import { reactReduxFirebase, getFirebase, toJS } from 'react-redux-firebase'
import { createLogger } from 'redux-logger'
import { firebase as fbConfig, reduxFirebase as reduxConfig } from '../config'
import makeRootReducer from './reducers'
import { updateLocation } from './location'

// NOTE: Runs an toJS action on every log (DEV ONLY)
const logger = createLogger({ // eslint-disable-line no-unused-vars
  stateTransformer: (state) => {
    if (state.firebase) {
      return { ...state, firebase: toJS(state.firebase) }
    }
    return state
  }
})

export default (initialState = {}, history) => {
  // ======================================================
  // Middleware Configuration
  // ======================================================
  const middleware = [
    thunk.withExtraArgument(getFirebase),
    logger, // Uncomment to see actions in console
    // This is where you add other middleware like redux-observable
  ]

  // ======================================================
  // Store Enhancers
  // ======================================================
  const enhancers = []
  if (__DEV__) {
    const devToolsExtension = window.devToolsExtension
    if (typeof devToolsExtension === 'function') {
      enhancers.push(devToolsExtension())
    }
  }

  // ======================================================
  // Store Instantiation and HMR Setup
  // ======================================================
  const store = createStore(
    makeRootReducer(),
    initialState,
    compose(
      applyMiddleware(...middleware),
      reactReduxFirebase(fbConfig, reduxConfig),
      ...enhancers
    )
  )
  store.asyncReducers = {}

  // To unsubscribe, invoke `store.unsubscribeHistory()` anytime
  store.unsubscribeHistory = browserHistory.listen(updateLocation(store))

  if (module.hot) {
    module.hot.accept('./reducers', () => {
      const reducers = require('./reducers').default
      store.replaceReducer(reducers(store.asyncReducers))
    })
  }

  return store
}
