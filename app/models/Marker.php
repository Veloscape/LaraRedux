<?php

class Marker extends Eloquent {
    
    //MASS ASSIGNMENT security
    protected $fillable = array('route_id', 'lat', 'lng', 'rev_geo');

    public function route() {
        return $this->belongsTo('Route');
    }

    public function values() {
        return $this->hasMany('MarkerValue');
    }
}
