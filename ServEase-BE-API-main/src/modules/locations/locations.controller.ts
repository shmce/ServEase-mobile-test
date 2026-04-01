import { Controller, Get, Version } from '@nestjs/common';
import { philippineLocations } from '../../mock-data/ph-locations';

@Controller('locations')
export class LocationsController {
    @Version('1')
    @Get()
    getLocations (){
        return philippineLocations;
    }
}