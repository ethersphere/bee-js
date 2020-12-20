import { Bee } from '../../src'

window.beeFactory = (...params: ConstructorParameters<typeof Bee>) => new Bee(...params)

window.bee = new Bee(__BEE_URL__)
